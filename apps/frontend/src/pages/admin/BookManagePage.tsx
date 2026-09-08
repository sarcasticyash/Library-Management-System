import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Edit3, MapPin } from 'lucide-react';
import { bookApi } from '../../api/book.api';
import { adminApi } from '../../api/admin.api';
import { BookGenre } from '../../types/book';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { PaginationBar } from '../../components/common/PaginationBar';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorAlert } from '../../components/ui/ErrorAlert';

const CreateBookSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  author: z.string().trim().min(1, 'Author is required'),
  isbn: z.string().trim().min(10, 'Valid ISBN required'),
  genre: z.nativeEnum(BookGenre),
  description: z.string().trim().min(1, 'Description is required'),
  publisher: z.string().trim().min(1, 'Publisher is required'),
  publicationYear: z.coerce.number().min(1800).max(new Date().getFullYear()),
  totalCopies: z.coerce.number().min(1, 'At least 1 copy required'),
  aisle: z.string().trim().min(1, 'Aisle required'),
  shelf: z.string().trim().min(1, 'Shelf required'),
});

type CreateBookFormValues = z.infer<typeof CreateBookSchema>;

export const BookManagePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-books', page],
    queryFn: () => bookApi.searchBooks({ page, limit: 10 }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateBookFormValues>({
    resolver: zodResolver(CreateBookSchema),
    defaultValues: {
      genre: BookGenre.COMPUTER_SCIENCE,
      publicationYear: 2024,
      totalCopies: 5,
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: CreateBookFormValues) =>
      adminApi.createBook({
        title: values.title,
        author: values.author,
        isbn: values.isbn,
        genre: values.genre,
        description: values.description,
        publisher: values.publisher,
        publicationYear: values.publicationYear,
        totalCopies: values.totalCopies,
        location: { aisle: values.aisle, shelf: values.shelf },
      }),
    onSuccess: () => {
      setIsAddModalOpen(false);
      reset();
      void queryClient.invalidateQueries({ queryKey: ['admin-books'] });
      void queryClient.invalidateQueries({ queryKey: ['books'] });
    },
    onError: (err: unknown) => {
      setActionError(err instanceof Error ? err.message : 'Failed to acquire book');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (bookId: string) => adminApi.deleteBook(bookId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-books'] });
      void queryClient.invalidateQueries({ queryKey: ['books'] });
    },
    onError: (err: unknown) => {
      setActionError(err instanceof Error ? err.message : 'Failed to deactivate book');
    },
  });

  const books = data?.data ?? [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Catalog Inventory Management</h1>
          <p className="page-subtitle">
            Acquire new titles, modify physical stock, and manage volume status
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={() => {
            setActionError(null);
            setIsAddModalOpen(true);
          }}
        >
          Acquire New Title
        </Button>
      </div>

      {actionError && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <ErrorAlert title="Administrative Action Failed" error={actionError} />
        </div>
      )}

      {isLoading && <LoadingSpinner message="Loading catalog roster..." />}

      {error && (
        <ErrorAlert
          title="Failed to Load Inventory"
          error={error instanceof Error ? error.message : 'Error fetching inventory'}
          onRetry={() => void refetch()}
        />
      )}

      {!isLoading && !error && (
        <>
          <div className="data-table-container" style={{ marginBottom: 'var(--space-6)' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title & Author</th>
                  <th>ISBN</th>
                  <th>Genre</th>
                  <th>Total Copies</th>
                  <th>Available</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book.id}>
                    <td>
                      <div>
                        <strong>{book.title}</strong>
                        <div
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--color-text-secondary)',
                          }}
                        >
                          by {book.author}
                        </div>
                      </div>
                    </td>
                    <td
                      style={{
                        fontFamily: 'var(--font-family-mono)',
                        fontSize: 'var(--font-size-xs)',
                      }}
                    >
                      {book.isbn}
                    </td>
                    <td>
                      <Badge variant="neutral">{book.genre}</Badge>
                    </td>
                    <td>{book.totalCopies}</td>
                    <td>
                      <Badge variant={book.availableCopies > 0 ? 'success' : 'danger'}>
                        {book.availableCopies}
                      </Badge>
                    </td>
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: 'var(--font-size-xs)',
                        }}
                      >
                        <MapPin size={12} style={{ color: 'var(--color-primary-400)' }} />
                        <span>Coordinates</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newTotal = prompt(
                              'Enter new total copy count:',
                              String(book.totalCopies),
                            );
                            if (newTotal && !isNaN(Number(newTotal))) {
                              adminApi
                                .updateBook(book.id, { totalCopies: Number(newTotal) })
                                .then(() =>
                                  queryClient.invalidateQueries({ queryKey: ['admin-books'] }),
                                )
                                .catch((e) =>
                                  setActionError(
                                    e instanceof Error ? e.message : 'Error updating stock',
                                  ),
                                );
                            }
                          }}
                          leftIcon={<Edit3 size={14} />}
                        >
                          Stock
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            if (
                              confirm(
                                `Deactivate '${book.title}'? This will soft-delete the record.`,
                              )
                            ) {
                              deactivateMutation.mutate(book.id);
                            }
                          }}
                          leftIcon={<Trash2 size={14} />}
                        >
                          Deactivate
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && (
            <PaginationBar
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              totalRecords={data.pagination.totalRecords}
              limit={data.pagination.limit}
              onPageChange={(newPage) => setPage(newPage)}
            />
          )}
        </>
      )}

      {/* Acquire New Book Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Acquire New Catalog Title"
        maxWidth="620px"
        footer={
          <>
            <Button
              variant="ghost"
              size="md"
              onClick={() => setIsAddModalOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={createMutation.isPending || isSubmitting}
              onClick={handleSubmit((v) => createMutation.mutate(v))}
            >
              Save & Acquire Title
            </Button>
          </>
        }
      >
        <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Input
            label="Book Title"
            placeholder="e.g. Designing Data-Intensive Applications"
            error={errors.title?.message}
            {...register('title')}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <Input
              label="Author Name"
              placeholder="e.g. Martin Kleppmann"
              error={errors.author?.message}
              {...register('author')}
            />
            <Input
              label="ISBN"
              placeholder="e.g. 978-1449373320"
              error={errors.isbn?.message}
              {...register('isbn')}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="form-group">
              <label className="form-label">Genre</label>
              <select className="form-select" {...register('genre')}>
                {Object.values(BookGenre).map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Publisher"
              placeholder="e.g. O'Reilly Media"
              error={errors.publisher?.message}
              {...register('publisher')}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <Input
              label="Publication Year"
              type="number"
              error={errors.publicationYear?.message}
              {...register('publicationYear')}
            />
            <Input
              label="Total Stock Copies"
              type="number"
              error={errors.totalCopies?.message}
              {...register('totalCopies')}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <Input
              label="Aisle Location"
              placeholder="e.g. B3"
              error={errors.aisle?.message}
              {...register('aisle')}
            />
            <Input
              label="Shelf Location"
              placeholder="e.g. 2A"
              error={errors.shelf?.message}
              {...register('shelf')}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Synopsis / Description</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Detailed description of the book..."
              {...register('description')}
            />
            {errors.description && <span className="form-error">{errors.description.message}</span>}
          </div>
        </form>
      </Modal>
    </div>
  );
};
