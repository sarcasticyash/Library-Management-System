import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export const ThreeBookCanvas: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 460;
    const height = mount.clientHeight || 480;

    // 1. Scene & Perspective Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 1000);
    camera.position.set(0, 0.16, 5.5);

    // 2. WebGL Renderer with Alpha
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    // 3. Studio Lighting Rig
    // Warm ambient base
    const ambientLight = new THREE.AmbientLight(0xfff5ea, 1.5);
    scene.add(ambientLight);

    // Key Light - Warm Directional
    const keyLight = new THREE.DirectionalLight(0xffeedd, 2.8);
    keyLight.position.set(4.5, 6, 4.5);
    scene.add(keyLight);

    // Fill Light - Soft cool balance
    const fillLight = new THREE.DirectionalLight(0xe8f0ff, 1.3);
    fillLight.position.set(-4.5, 3, 3);
    scene.add(fillLight);

    // Rim/Kick Light - Golden edge highlight on spine and leather
    const rimLight = new THREE.DirectionalLight(0xffd288, 2.0);
    rimLight.position.set(-3, 2, -4);
    scene.add(rimLight);

    // Specular Point Light for gold foil glint
    const goldGlintLight = new THREE.PointLight(0xffaa44, 3.5, 8);
    goldGlintLight.position.set(1.2, 2.2, 3.0);
    scene.add(goldGlintLight);

    // 4. Procedural High-Resolution Textures

    // (A) Front Cover Texture (Obsidian Moroccan Leather + Hot-Stamped Metallic Gold Foil)
    const createCoverTextures = () => {
      const w = 1024;
      const h = 1400;

      // Color Map
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return { color: null, bump: null };

      // Base: Rich Obsidian Leather with radial vignette
      const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 80, w / 2, h / 2, 900);
      bgGrad.addColorStop(0, '#22160e');
      bgGrad.addColorStop(0.55, '#170e08');
      bgGrad.addColorStop(1, '#0c0704');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Fine leather grain micro-texture
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 14;
        data[i] = Math.max(0, Math.min(255, (data[i] ?? 0) + noise));
        data[i + 1] = Math.max(0, Math.min(255, (data[i + 1] ?? 0) + noise * 0.8));
        data[i + 2] = Math.max(0, Math.min(255, (data[i + 2] ?? 0) + noise * 0.6));
      }
      ctx.putImageData(imgData, 0, 0);

      // Metallic Gold Foil Gradient Helper
      const createGoldGrad = (x1: number, y1: number, x2: number, y2: number) => {
        const g = ctx.createLinearGradient(x1, y1, x2, y2);
        g.addColorStop(0, '#b8860b');
        g.addColorStop(0.25, '#ffd700');
        g.addColorStop(0.48, '#fff4cc');
        g.addColorStop(0.68, '#daa520');
        g.addColorStop(0.88, '#ffd700');
        g.addColorStop(1, '#996515');
        return g;
      };

      const goldFoil = createGoldGrad(60, 60, w - 60, h - 60);

      // Outer Ornate Frame
      ctx.strokeStyle = goldFoil;
      ctx.lineWidth = 6;
      ctx.strokeRect(50, 50, w - 100, h - 100);

      ctx.lineWidth = 2;
      ctx.strokeRect(66, 66, w - 132, h - 132);

      // Corner Arabesque Filigree
      const drawCornerFiligree = (cx: number, cy: number, rot: number) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.strokeStyle = goldFoil;
        ctx.lineWidth = 2.5;

        // Leaf / scroll flourishes
        ctx.beginPath();
        ctx.arc(36, 36, 24, 0, Math.PI * 1.5, false);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(14, 14);
        ctx.lineTo(54, 14);
        ctx.lineTo(14, 54);
        ctx.closePath();
        ctx.stroke();

        // Corner diamond stud
        ctx.fillStyle = '#f14616';
        ctx.beginPath();
        ctx.arc(28, 28, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      };

      drawCornerFiligree(75, 75, 0);
      drawCornerFiligree(w - 75, 75, Math.PI / 2);
      drawCornerFiligree(w - 75, h - 75, Math.PI);
      drawCornerFiligree(75, h - 75, -Math.PI / 2);

      // Header Tagline
      ctx.textAlign = 'center';
      ctx.font = 'bold 24px "JetBrains Mono", monospace';
      ctx.fillStyle = goldFoil;
      ctx.letterSpacing = '6px';
      ctx.fillText('NĀLANDĀ ARCHIVES', w / 2, 220);

      ctx.font = '500 16px "Inter", sans-serif';
      ctx.fillStyle = '#a89a88';
      ctx.letterSpacing = '3px';
      ctx.fillText('COLLECTOR EDITION • ED. 2026', w / 2, 265);

      // Center Heraldic Archival Crest
      const cy = 520;
      ctx.strokeStyle = goldFoil;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(w / 2, cy, 110, 0, Math.PI * 2);
      ctx.stroke();

      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(w / 2, cy, 118, 0, Math.PI * 2);
      ctx.stroke();

      // Open Book Heraldic Icon inside Crest
      ctx.fillStyle = goldFoil;
      ctx.beginPath();
      // Left page curve
      ctx.moveTo(w / 2, cy + 15);
      ctx.bezierCurveTo(w / 2 - 30, cy - 5, w / 2 - 60, cy - 5, w / 2 - 65, cy + 25);
      ctx.lineTo(w / 2 - 65, cy - 35);
      ctx.bezierCurveTo(w / 2 - 60, cy - 65, w / 2 - 30, cy - 65, w / 2, cy - 45);
      // Right page curve
      ctx.bezierCurveTo(w / 2 + 30, cy - 65, w / 2 + 60, cy - 65, w / 2 + 65, cy - 35);
      ctx.lineTo(w / 2 + 65, cy + 25);
      ctx.bezierCurveTo(w / 2 + 60, cy - 5, w / 2 + 30, cy - 5, w / 2, cy + 15);
      ctx.fill();

      // Station code inside crest
      ctx.fillStyle = '#f14616';
      ctx.font = 'bold 22px "JetBrains Mono", monospace';
      ctx.fillText('STATION 042-B', w / 2, cy + 62);

      // Main Debossed Gold & Orange Title
      ctx.fillStyle = goldFoil;
      ctx.font = 'bold 58px "Syne", sans-serif';
      ctx.letterSpacing = '2px';
      ctx.fillText('PULL A SPINE', w / 2, 790);

      // Hot-stamped poster orange lacquer
      ctx.fillStyle = '#f14616';
      ctx.font = 'italic bold 44px "Syne", sans-serif';
      ctx.fillText('STAMP THE SLIP', w / 2, 855);

      // French groove embossed divider
      ctx.strokeStyle = goldFoil;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 160, 920);
      ctx.lineTo(w / 2 + 160, 920);
      ctx.stroke();

      ctx.fillStyle = '#f14616';
      ctx.beginPath();
      ctx.arc(w / 2, 920, 6, 0, Math.PI * 2);
      ctx.fill();

      // Lower Subtitle & Archival Seal
      ctx.fillStyle = '#c7beaf';
      ctx.font = '500 18px "Inter", sans-serif';
      ctx.letterSpacing = '2px';
      ctx.fillText('FOUNDATION CATALOG // VOL. I', w / 2, 1080);

      ctx.fillStyle = '#8a7d6e';
      ctx.font = '14px "JetBrains Mono", monospace';
      ctx.fillText('350GSM RAG PAPER • RFID ENCODED', w / 2, 1120);

      // Bump Map Canvas for physical 3D relief
      const bumpCanvas = document.createElement('canvas');
      bumpCanvas.width = 512;
      bumpCanvas.height = 700;
      const bCtx = bumpCanvas.getContext('2d');
      if (bCtx) {
        bCtx.fillStyle = '#808080';
        bCtx.fillRect(0, 0, 512, 700);

        // Leather grain bump noise
        const bImg = bCtx.getImageData(0, 0, 512, 700);
        const bData = bImg.data;
        for (let i = 0; i < bData.length; i += 4) {
          const n = (Math.random() - 0.5) * 32;
          bData[i] = Math.max(0, Math.min(255, 128 + n));
          bData[i + 1] = Math.max(0, Math.min(255, 128 + n));
          bData[i + 2] = Math.max(0, Math.min(255, 128 + n));
        }
        bCtx.putImageData(bImg, 0, 0);

        // Embossed gold borders in white (high relief)
        bCtx.strokeStyle = '#ffffff';
        bCtx.lineWidth = 3;
        bCtx.strokeRect(25, 25, 512 - 50, 700 - 50);

        // Debossed title groove
        bCtx.strokeStyle = '#000000';
        bCtx.lineWidth = 4;
        bCtx.beginPath();
        bCtx.arc(256, 260, 55, 0, Math.PI * 2);
        bCtx.stroke();
      }

      return {
        color: new THREE.CanvasTexture(canvas),
        bump: new THREE.CanvasTexture(bumpCanvas),
      };
    };

    // (B) Back Cover Texture (Obsidian Moroccan Leather + Gold Foil Seal, Latin Epigram & ISBN Barcode)
    const createBackCoverTexture = () => {
      const w = 1024;
      const h = 1400;

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Base: Rich Obsidian Leather with radial vignette
      const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 80, w / 2, h / 2, 900);
      bgGrad.addColorStop(0, '#22160e');
      bgGrad.addColorStop(0.55, '#170e08');
      bgGrad.addColorStop(1, '#0c0704');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Fine leather grain micro-texture
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 14;
        data[i] = Math.max(0, Math.min(255, (data[i] ?? 0) + noise));
        data[i + 1] = Math.max(0, Math.min(255, (data[i + 1] ?? 0) + noise * 0.8));
        data[i + 2] = Math.max(0, Math.min(255, (data[i + 2] ?? 0) + noise * 0.6));
      }
      ctx.putImageData(imgData, 0, 0);

      // Metallic Gold Foil Gradient
      const goldFoil = ctx.createLinearGradient(60, 60, w - 60, h - 60);
      goldFoil.addColorStop(0, '#b8860b');
      goldFoil.addColorStop(0.25, '#ffd700');
      goldFoil.addColorStop(0.48, '#fff4cc');
      goldFoil.addColorStop(0.68, '#daa520');
      goldFoil.addColorStop(0.88, '#ffd700');
      goldFoil.addColorStop(1, '#996515');

      // Outer Ornate Frame
      ctx.strokeStyle = goldFoil;
      ctx.lineWidth = 6;
      ctx.strokeRect(50, 50, w - 100, h - 100);

      ctx.lineWidth = 2;
      ctx.strokeRect(66, 66, w - 132, h - 132);

      // Corner Arabesque Filigree
      const drawCorner = (cx: number, cy: number, rot: number) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.strokeStyle = goldFoil;
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.arc(36, 36, 24, 0, Math.PI * 1.5, false);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(14, 14);
        ctx.lineTo(54, 14);
        ctx.lineTo(14, 54);
        ctx.closePath();
        ctx.stroke();

        ctx.fillStyle = '#f14616';
        ctx.beginPath();
        ctx.arc(28, 28, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      };

      drawCorner(75, 75, 0);
      drawCorner(w - 75, 75, Math.PI / 2);
      drawCorner(w - 75, h - 75, Math.PI);
      drawCorner(75, h - 75, -Math.PI / 2);

      // Top Publisher Header
      ctx.textAlign = 'center';
      ctx.font = 'bold 22px "JetBrains Mono", monospace';
      ctx.fillStyle = goldFoil;
      ctx.letterSpacing = '5px';
      ctx.fillText('NĀLANDĀ ARCHIVAL REPOSITORY', w / 2, 200);

      ctx.font = '500 15px "Inter", sans-serif';
      ctx.fillStyle = '#9c8c79';
      ctx.letterSpacing = '3px';
      ctx.fillText('FOUNDED 1892 • STATION 042-B', w / 2, 240);

      // Center Heraldic Medallion Seal
      const cy = 460;
      ctx.strokeStyle = goldFoil;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(w / 2, cy, 105, 0, Math.PI * 2);
      ctx.stroke();

      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(w / 2, cy, 114, 0, Math.PI * 2);
      ctx.stroke();

      // Radiating sunburst rays around seal
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
        const x1 = w / 2 + Math.cos(angle) * 116;
        const y1 = cy + Math.sin(angle) * 116;
        const x2 = w / 2 + Math.cos(angle) * 128;
        const y2 = cy + Math.sin(angle) * 128;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Heraldic Open Book & Wisdom Star Icon inside Seal
      ctx.fillStyle = goldFoil;
      ctx.beginPath();
      ctx.moveTo(w / 2, cy + 10);
      ctx.bezierCurveTo(w / 2 - 25, cy - 8, w / 2 - 50, cy - 8, w / 2 - 55, cy + 18);
      ctx.lineTo(w / 2 - 55, cy - 30);
      ctx.bezierCurveTo(w / 2 - 50, cy - 55, w / 2 - 25, cy - 55, w / 2, cy - 38);
      ctx.bezierCurveTo(w / 2 + 25, cy - 55, w / 2 + 50, cy - 55, w / 2 + 55, cy - 30);
      ctx.lineTo(w / 2 + 55, cy + 18);
      ctx.bezierCurveTo(w / 2 + 50, cy - 8, w / 2 + 25, cy - 8, w / 2, cy + 10);
      ctx.fill();

      // Orange Lacquer Emblem inside Seal
      ctx.fillStyle = '#f14616';
      ctx.font = 'bold 20px "JetBrains Mono", monospace';
      ctx.fillText('EST. 1892', w / 2, cy + 50);

      // Latin Archival Inscription
      ctx.fillStyle = goldFoil;
      ctx.font = 'italic 26px "Georgia", serif';
      ctx.fillText('“Ex Antiquitate Scientia, Ex Scientia Lux”', w / 2, 650);

      ctx.fillStyle = '#9c8c79';
      ctx.font = '14px "Inter", sans-serif';
      ctx.letterSpacing = '1.5px';
      ctx.fillText('FROM ANTIQUITY KNOWLEDGE • FROM KNOWLEDGE LIGHT', w / 2, 690);

      // Archival Summary Box (Synopsis)
      ctx.strokeStyle = '#3d2b1f';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(160, 740, w - 320, 205);

      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      ctx.letterSpacing = '2px';
      ctx.fillText('CATALOG DEPOSIT // 125 ARCHIVAL HOLDINGS • 24 TITLES', w / 2, 790);

      ctx.fillStyle = '#c7beaf';
      ctx.font = '18px "Georgia", serif';
      ctx.fillText('A permanent record of intellectual inquiry, preserving human', w / 2, 835);
      ctx.fillText('narrative across centuries with physical bookplate binding', w / 2, 870);
      ctx.fillText('and sub-300ms cloud coordinates.', w / 2, 905);

      // Cream Barcode & ISBN Label Inset
      const bx = 220;
      const by = 1000;
      const bw = w - 440;
      const bh = 220;

      ctx.fillStyle = '#f5eedf';
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = '#baa993';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, bw, bh);

      // Barcode lines
      ctx.fillStyle = '#1c140e';
      ctx.fillRect(bx + 40, by + 30, bw - 80, 70);

      // Draw vertical barcode stripes
      ctx.fillStyle = '#f5eedf';
      const stripePattern = [
        3, 2, 5, 2, 4, 3, 2, 6, 2, 3, 5, 2, 4, 3, 6, 2, 3, 4, 2, 5, 3, 2, 4, 6, 2, 3, 5, 2, 4,
      ];
      let stripeX = bx + 50;
      stripePattern.forEach((sw, idx) => {
        if (idx % 2 === 0) {
          ctx.fillRect(stripeX, by + 30, sw * 4, 70);
        }
        stripeX += sw * 5.5;
      });

      // ISBN Text
      ctx.fillStyle = '#1c140e';
      ctx.font = 'bold 18px "JetBrains Mono", monospace';
      ctx.letterSpacing = '2px';
      ctx.fillText('ISBN 978-81-7236-021-4', w / 2, by + 140);

      ctx.font = '13px "JetBrains Mono", monospace';
      ctx.fillStyle = '#5c4e43';
      ctx.fillText('CLASSIFICATION: ARCHIVAL PRESERVATION • STATION 042-B', w / 2, by + 172);
      ctx.fillText('NOT FOR RESALE • PERMANENT LIBRARY COLLECTION', w / 2, by + 195);

      // Red Rubber Accession Stamp on the Back Cover Corner
      ctx.save();
      ctx.translate(w - 230, by + 18);
      ctx.rotate(-0.06);
      ctx.strokeStyle = '#f14616';
      ctx.lineWidth = 3;
      ctx.strokeRect(-110, -28, 220, 56);
      ctx.fillStyle = '#f14616';
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.fillText('VERIFIED HOLDING', 0, -4);
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillText('09 SEP 2026 APPROVED', 0, 16);
      ctx.restore();

      return new THREE.CanvasTexture(canvas);
    };

    // (C) Spine Texture with 5 Raised Rib Compartments & Gold Lettering
    const createSpineTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 1400;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Dark leather background with gradient curvature
      const grad = ctx.createLinearGradient(0, 0, 256, 0);
      grad.addColorStop(0, '#0d0704');
      grad.addColorStop(0.3, '#22160e');
      grad.addColorStop(0.7, '#22160e');
      grad.addColorStop(1, '#0a0503');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 1400);

      // Gold styling helper
      const gold = '#d4af37';

      // 5 Raised Bands / Ribs with gold tooling
      const bandPositions = [140, 420, 700, 980, 1260];
      bandPositions.forEach((y) => {
        // Shadow underneath band
        ctx.fillStyle = '#050302';
        ctx.fillRect(0, y - 10, 256, 20);

        // High leather band
        ctx.fillStyle = '#2c1e14';
        ctx.fillRect(0, y - 6, 256, 12);

        // Gold fillet lines on the band
        ctx.fillStyle = gold;
        ctx.fillRect(16, y - 7, 224, 2);
        ctx.fillRect(16, y + 5, 224, 2);
      });

      // Gold Title in Compartment 2
      ctx.save();
      ctx.translate(128, 560);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 36px "Syne", sans-serif';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '4px';
      ctx.fillText('NĀLANDĀ', 0, 6);
      ctx.restore();

      // Volume & Station in Compartment 3
      ctx.save();
      ctx.translate(128, 840);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = '#f14616';
      ctx.font = 'bold 26px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '3px';
      ctx.fillText('VOL. I • LMS 042', 0, 6);
      ctx.restore();

      return new THREE.CanvasTexture(canvas);
    };

    // (C) Inside Left Cover Texture (Steel-Engraved Ex Libris Bookplate + Date Due Slip)
    const createInsideCoverTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1400;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Heavy cream rag paper background
      ctx.fillStyle = '#f5eedf';
      ctx.fillRect(0, 0, 1024, 1400);

      // Bookplate woodcut border
      ctx.strokeStyle = '#2d241e';
      ctx.lineWidth = 5;
      ctx.strokeRect(80, 90, 864, 1220);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(96, 106, 832, 1188);

      // Corner rosettes
      const drawRosette = (x: number, y: number) => {
        ctx.strokeStyle = '#2d241e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 16, 0, Math.PI * 2);
        ctx.stroke();
      };
      drawRosette(96, 106);
      drawRosette(928, 106);
      drawRosette(96, 1294);
      drawRosette(928, 1294);

      // Header EX LIBRIS
      ctx.fillStyle = '#1c140e';
      ctx.textAlign = 'center';
      ctx.font = 'bold 32px "JetBrains Mono", monospace';
      ctx.letterSpacing = '6px';
      ctx.fillText('EX LIBRIS', 512, 230);

      ctx.font = 'bold 52px "Syne", sans-serif';
      ctx.fillStyle = '#f14616';
      ctx.fillText('NĀLANDĀ', 512, 310);

      ctx.font = '600 20px "Inter", sans-serif';
      ctx.fillStyle = '#5c4e43';
      ctx.letterSpacing = '2px';
      ctx.fillText('CENTRAL ARCHIVE & HOLDING REPOSITORY', 512, 360);

      // Divider Line
      ctx.strokeStyle = '#b8ab99';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(180, 410);
      ctx.lineTo(844, 410);
      ctx.stroke();

      // Card Pocket Frame ("Date Due Slip")
      ctx.fillStyle = '#fffcf7';
      ctx.strokeStyle = '#9c8c79';
      ctx.lineWidth = 2;
      ctx.fillRect(200, 480, 624, 580);
      ctx.strokeRect(200, 480, 624, 580);

      // Date Due Slip Header
      ctx.fillStyle = '#2d241e';
      ctx.font = 'bold 22px "JetBrains Mono", monospace';
      ctx.fillText('CIRCULATION RECORD // STATION 042-B', 512, 535);

      ctx.font = '14px "Inter", sans-serif';
      ctx.fillStyle = '#7a6c5d';
      ctx.fillText('THIS VOLUME MUST BE RETURNED WITHIN 14 DAYS', 512, 570);

      // Table Lines
      ctx.strokeStyle = '#ded5c7';
      for (let y = 620; y <= 980; y += 60) {
        ctx.beginPath();
        ctx.moveTo(220, y);
        ctx.lineTo(804, y);
        ctx.stroke();
      }

      // Red Rubber Stamp Marks on Slip
      const drawRubberStamp = (text: string, date: string, x: number, y: number, angle: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.strokeStyle = '#f14616';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-140, -25, 280, 50);
        ctx.fillStyle = '#f14616';
        ctx.font = 'bold 15px "JetBrains Mono", monospace';
        ctx.fillText(text, 0, -4);
        ctx.font = '13px "JetBrains Mono", monospace';
        ctx.fillText(date, 0, 16);
        ctx.restore();
      };

      drawRubberStamp('OFFICIALLY LOANED', '14 OCT 1928 // DESK 04', 380, 670, -0.06);
      drawRubberStamp('DIGITAL CLEARANCE', '09 SEP 2026 // APPROVED', 580, 790, 0.04);

      // Barcode at bottom of slip
      ctx.fillStyle = '#2d241e';
      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      ctx.fillText('||||| |||| |||||| ||||| ||||||| ||||', 512, 940);
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillText('HOLDING CODE: 8420-9941-LMS', 512, 970);

      // Accession Seal at Bottom
      ctx.strokeStyle = '#f14616';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(512, 1180, 50, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#f14616';
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.fillText('VERIFIED ARCHIVE', 512, 1175);
      ctx.fillText('STATION 042-B', 512, 1195);

      return new THREE.CanvasTexture(canvas);
    };

    // (D) Inside Right Page (Illuminated Manuscript Title Leaf)
    const createRightPageTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1400;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Parchment paper
      ctx.fillStyle = '#fbf7ee';
      ctx.fillRect(0, 0, 1024, 1400);

      // Page gutter inner shadow on left
      const gutter = ctx.createLinearGradient(0, 0, 90, 0);
      gutter.addColorStop(0, 'rgba(29, 24, 21, 0.18)');
      gutter.addColorStop(1, 'rgba(29, 24, 21, 0)');
      ctx.fillStyle = gutter;
      ctx.fillRect(0, 0, 90, 1400);

      // Top running header
      ctx.fillStyle = '#7a6d5f';
      ctx.font = '500 16px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '3px';
      ctx.fillText('NĀLANDĀ ARCHIVES • VOLUME I • FOLIO 042', 512, 110);

      ctx.strokeStyle = '#d6cbba';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(120, 135);
      ctx.lineTo(904, 135);
      ctx.stroke();

      // Chapter Label
      ctx.fillStyle = '#f14616';
      ctx.font = 'bold 22px "JetBrains Mono", monospace';
      ctx.letterSpacing = '4px';
      ctx.fillText('CHAPTER I', 512, 230);

      // Title
      ctx.fillStyle = '#171412';
      ctx.font = 'bold 44px "Syne", sans-serif';
      ctx.fillText('THE SANCTUARY OF LIVING WORDS', 512, 300);

      // Large Red-Orange Woodcut Drop Cap 'P'
      const dropX = 130;
      const dropY = 410;
      const dropSize = 140;

      // Drop cap decorative frame
      ctx.fillStyle = '#f14616';
      ctx.fillRect(dropX, dropY, dropSize, dropSize);

      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.strokeRect(dropX + 6, dropY + 6, dropSize - 12, dropSize - 12);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 110px "Georgia", serif';
      ctx.textAlign = 'center';
      ctx.fillText('P', dropX + dropSize / 2, dropY + dropSize - 25);

      // Body text alongside drop cap
      ctx.textAlign = 'left';
      ctx.fillStyle = '#261e18';
      ctx.font = '22px "Georgia", serif';
      ctx.fillText('ull a spine from the cedar shelves,', dropX + dropSize + 30, dropY + 45);
      ctx.fillText(
        'and feel the weight of enduring human inquiry',
        dropX + dropSize + 30,
        dropY + 90,
      );
      ctx.fillText(
        'settle into your hands. A library is never a mere',
        dropX + dropSize + 30,
        dropY + 135,
      );

      // Body paragraphs
      const bodyLines = [
        'warehouse of dry paper; it is a living cathedral where forgotten questions',
        'find sudden and luminous answers.',
        '',
        'Within these catalog corridors, 125 archival holdings and 24 curated masterworks breathe in real-time.',
        'Circulation flows seamlessly across physical stacks and digital streams,',
        'guided by sub-300ms catalog discovery and aisle coordinates.',
        '',
        'Turn the leaf. The story you seek has been waiting for you.',
      ];

      let textY = 620;
      ctx.font = '22px "Georgia", serif';
      bodyLines.forEach((line) => {
        if (line) {
          ctx.fillText(line, 130, textY);
        }
        textY += 46;
      });

      // Gold Archival Seal at Bottom
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(512, 1150, 45, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#f14616';
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NĀLANDĀ', 512, 1145);
      ctx.fillText('STAMPED 2026', 512, 1165);

      // Page Folio
      ctx.fillStyle = '#8a7d6e';
      ctx.font = '16px "JetBrains Mono", monospace';
      ctx.fillText('— 042 —', 512, 1280);

      return new THREE.CanvasTexture(canvas);
    };

    // (E) Gilt Top Edge Texture & Page Lines
    const createPagesEdgeTexture = (isGilt: boolean) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      if (isGilt) {
        // Metallic Gold Leaf Top Edge
        const g = ctx.createLinearGradient(0, 0, 512, 512);
        g.addColorStop(0, '#b8860b');
        g.addColorStop(0.3, '#ffd700');
        g.addColorStop(0.6, '#fff4cc');
        g.addColorStop(0.85, '#daa520');
        g.addColorStop(1, '#996515');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 512, 512);
      } else {
        // High-density laid paper lines
        ctx.fillStyle = '#f6ede0';
        ctx.fillRect(0, 0, 512, 512);
        ctx.strokeStyle = '#dbcca8';
        ctx.lineWidth = 1;
        for (let y = 0; y < 512; y += 4) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(512, y);
          ctx.stroke();
        }
      }
      return new THREE.CanvasTexture(canvas);
    };

    // (F) Soft Contact Shadow Plane Texture
    const createContactShadowTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const g = ctx.createRadialGradient(256, 256, 30, 256, 256, 230);
      g.addColorStop(0, 'rgba(18, 14, 11, 0.42)');
      g.addColorStop(0.4, 'rgba(18, 14, 11, 0.22)');
      g.addColorStop(0.8, 'rgba(18, 14, 11, 0.04)');
      g.addColorStop(1, 'rgba(18, 14, 11, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 512, 512);

      return new THREE.CanvasTexture(canvas);
    };

    // Generate Textures
    const coverTextures = createCoverTextures();
    const backCoverTexture = createBackCoverTexture();
    const spineTexture = createSpineTexture();
    const insideCoverTexture = createInsideCoverTexture();
    const rightPageTexture = createRightPageTexture();
    const giltEdgeTexture = createPagesEdgeTexture(true);
    const foreEdgeTexture = createPagesEdgeTexture(false);
    const shadowTexture = createContactShadowTexture();

    // 5. 3D Book Geometry Assembly (Refined, Slightly Scaled-Down Dimensions)

    // Root Group
    const bookGroup = new THREE.Group();
    scene.add(bookGroup);

    // Architectural Book Dimensions - Scaled Down ~12% for Sleek, Balanced Elegance
    const bookWidth = 1.95;
    const bookHeight = 2.68;
    const bookThickness = 0.38;
    const coverThickness = 0.04;
    const boardSquare = 0.055; // Overhanging squares of genuine bookbinding

    // Contact Shadow Plane beneath the book
    if (shadowTexture) {
      const shadowGeo = new THREE.PlaneGeometry(3.1, 2.1);
      const shadowMat = new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      });
      const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
      shadowMesh.rotation.x = -Math.PI / 2;
      shadowMesh.position.set(0, -1.48, 0);
      scene.add(shadowMesh);
    }

    // Back Cover Mesh - Front side faces inside, Back side faces outward when rotated 360°!
    const backCoverGeo = new THREE.BoxGeometry(
      bookWidth + boardSquare,
      bookHeight + boardSquare * 2,
      coverThickness,
    );
    const backCoverMats = [
      new THREE.MeshStandardMaterial({ color: 0x1b1107, roughness: 0.4 }), // right
      new THREE.MeshStandardMaterial({ color: 0x1b1107, roughness: 0.4 }), // left
      new THREE.MeshStandardMaterial({ color: 0x1b1107, roughness: 0.4 }), // top
      new THREE.MeshStandardMaterial({ color: 0x1b1107, roughness: 0.4 }), // bottom
      new THREE.MeshBasicMaterial({ color: 0x1a1109 }), // inside face (facing pages)
      new THREE.MeshStandardMaterial({
        map: backCoverTexture ?? undefined,
        bumpMap: coverTextures.bump ?? undefined,
        bumpScale: 0.035,
        roughness: 0.28,
        metalness: 0.18,
      }), // Back outer face (FACING VIEWER WHEN ROTATED 360°!)
    ];
    const backCover = new THREE.Mesh(backCoverGeo, backCoverMats);
    backCover.position.set(boardSquare / 2, 0, -bookThickness / 2);
    bookGroup.add(backCover);

    // Spine Mesh (Semi-cylinder with 5 raised leather bands)
    const spineRadius = bookThickness / 2;
    const spineGeo = new THREE.CylinderGeometry(
      spineRadius,
      spineRadius,
      bookHeight + boardSquare * 2,
      24,
      1,
      false,
      0,
      Math.PI,
    );
    const spineMat = new THREE.MeshStandardMaterial({
      map: spineTexture ?? undefined,
      roughness: 0.35,
      metalness: 0.15,
    });
    const spine = new THREE.Mesh(spineGeo, spineMat);
    spine.rotation.y = Math.PI / 2;
    spine.position.set(-bookWidth / 2 - boardSquare / 2, 0, 0);
    bookGroup.add(spine);

    // 5 Physical Raised Leather Bands on Spine
    const ribGeo = new THREE.TorusGeometry(spineRadius + 0.012, 0.022, 12, 24, Math.PI);
    const ribMat = new THREE.MeshStandardMaterial({
      color: 0x22150c,
      roughness: 0.3,
      metalness: 0.2,
    });
    const ribOffsets = [-0.96, -0.48, 0, 0.48, 0.96];
    ribOffsets.forEach((ry) => {
      const rib = new THREE.Mesh(ribGeo, ribMat);
      rib.rotation.y = -Math.PI / 2;
      rib.position.set(-bookWidth / 2 - boardSquare / 2, ry, 0);
      bookGroup.add(rib);
    });

    // Pages Block Mesh (With Gilt Gold Top Edge!)
    const pagesGeo = new THREE.BoxGeometry(
      bookWidth - 0.08,
      bookHeight - 0.04,
      bookThickness - 0.07,
    );
    const pagesMats = [
      new THREE.MeshStandardMaterial({ map: foreEdgeTexture ?? undefined, roughness: 0.85 }), // right edge
      new THREE.MeshBasicMaterial({ color: 0x140c06 }), // spine side
      new THREE.MeshStandardMaterial({
        map: giltEdgeTexture ?? undefined,
        roughness: 0.25,
        metalness: 0.75, // Gilded top edge shines!
      }), // top edge
      new THREE.MeshStandardMaterial({ map: foreEdgeTexture ?? undefined, roughness: 0.85 }), // bottom edge
      new THREE.MeshStandardMaterial({ map: rightPageTexture ?? undefined, roughness: 0.7 }), // front face (READABLE PAGE)
      new THREE.MeshBasicMaterial({ color: 0xf5eedf }), // back face
    ];
    const pagesBlock = new THREE.Mesh(pagesGeo, pagesMats);
    pagesBlock.position.set(0.04, 0, 0);
    bookGroup.add(pagesBlock);

    // Silk Bookmark Ribbon (Drapes gracefully with realistic curve)
    const ribbonCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.18, 1.2, 0),
      new THREE.Vector3(0.26, 0.45, 0.1),
      new THREE.Vector3(0.34, -1.35, 0.22),
      new THREE.Vector3(0.4, -1.62, 0.14),
      new THREE.Vector3(0.44, -1.78, 0.06),
    ]);
    const ribbonGeo = new THREE.TubeGeometry(ribbonCurve, 32, 0.038, 8, false);
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: 0xf14616,
      roughness: 0.25,
      metalness: 0.35,
    });
    const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    bookGroup.add(ribbon);

    // Hinge Pivot for Front Cover Board
    const frontCoverPivot = new THREE.Group();
    frontCoverPivot.position.set(-bookWidth / 2 - boardSquare / 2, 0, bookThickness / 2);
    bookGroup.add(frontCoverPivot);

    const frontCoverGeo = new THREE.BoxGeometry(
      bookWidth + boardSquare,
      bookHeight + boardSquare * 2,
      coverThickness,
    );
    const frontCoverMats = [
      new THREE.MeshStandardMaterial({ color: 0x1b1107, roughness: 0.4 }), // right edge
      new THREE.MeshStandardMaterial({ color: 0x1b1107, roughness: 0.4 }), // left edge
      new THREE.MeshStandardMaterial({ color: 0x1b1107, roughness: 0.4 }), // top edge
      new THREE.MeshStandardMaterial({ color: 0x1b1107, roughness: 0.4 }), // bottom edge
      new THREE.MeshStandardMaterial({
        map: coverTextures.color ?? undefined,
        bumpMap: coverTextures.bump ?? undefined,
        bumpScale: 0.035,
        roughness: 0.28,
        metalness: 0.18,
      }), // Front face (Gold foil)
      new THREE.MeshStandardMaterial({
        map: insideCoverTexture ?? undefined,
        roughness: 0.7,
      }), // Inside cover (Bookplate)
    ];
    const frontCover = new THREE.Mesh(frontCoverGeo, frontCoverMats);
    frontCover.position.set((bookWidth + boardSquare) / 2, 0, 0);
    frontCoverPivot.add(frontCover);

    // 6. Interactive State & 360° Drag-to-Rotate Engine
    let targetCoverAngle = 0;
    const defaultRotY = -0.42;
    const defaultRotX = 0.18;

    let rotY = defaultRotY;
    let rotX = defaultRotX;
    let targetRotY = defaultRotY;
    let targetRotX = defaultRotX;

    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    let isOpen = false;

    // Toggle Open Callback (Clicking opens, clicking again closes & resumes 360° rotation)
    const toggleBook = () => {
      isOpen = !isOpen;

      if (isOpen) {
        // Open book: swing cover open ~155 degrees and orient to reader
        targetCoverAngle = -Math.PI * 0.86;
        // Snap to nearest turn forward so it doesn't spin backward
        const nearestTurn = Math.round(targetRotY / (Math.PI * 2)) * (Math.PI * 2);
        targetRotY = nearestTurn + 0.06;
        targetRotX = 0.26;
      } else {
        // Close book: cover shuts and continuous 360° rotation immediately resumes!
        targetCoverAngle = 0;
        targetRotX = defaultRotX;
      }
    };

    // Mouse Drag Listeners
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isDragging = true;
        setIsInteracting(true);
        previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    };

    let totalDragDistance = 0;

    const onMouseMove = (e: MouseEvent) => {
      // Specular glint follows cursor
      const rect = mount.getBoundingClientRect();
      const normX = (e.clientX - rect.left) / rect.width - 0.5;
      const normY = (e.clientY - rect.top) / rect.height - 0.5;
      goldGlintLight.position.set(normX * 4 + 1.2, -normY * 4 + 2.2, 3.2);

      if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;
        totalDragDistance += Math.hypot(deltaX, deltaY);

        targetRotY += deltaX * 0.008;
        // Clamp vertical tilt to prevent tumbling upside down
        targetRotX = Math.max(-0.5, Math.min(0.7, targetRotX + deltaY * 0.008));

        previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseUp = () => {
      if (isDragging) {
        isDragging = false;
        setIsInteracting(false);

        // If mouse moved less than 6 pixels, treat as a click to open/close
        if (totalDragDistance < 6) {
          toggleBook();
        }
        totalDragDistance = 0;
      }
    };

    const onMouseLeave = () => {
      if (isDragging) {
        isDragging = false;
        setIsInteracting(false);
        totalDragDistance = 0;
      }
    };

    mount.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    mount.addEventListener('mouseleave', onMouseLeave);

    // 7. Render Animation Loop (Continuous 360° Turntable Rotation)
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // CONTINUOUS 360° AUTOMATIC ROTATION:
      // When closed and not actively being dragged, continuously rotate gracefully
      if (!isOpen && !isDragging) {
        targetRotY += 0.007; // Steady, cinematic turntable spin
        targetRotX = THREE.MathUtils.lerp(targetRotX, defaultRotX, 0.05);
      }

      // Smooth cover opening / closing interpolation
      frontCoverPivot.rotation.y = THREE.MathUtils.lerp(
        frontCoverPivot.rotation.y,
        targetCoverAngle,
        0.09,
      );

      // Smooth 3D rotation interpolation (damped inertia)
      rotY = THREE.MathUtils.lerp(rotY, targetRotY, 0.08);
      rotX = THREE.MathUtils.lerp(rotX, targetRotX, 0.08);

      bookGroup.rotation.y = rotY;
      bookGroup.rotation.x = rotX;

      // Subtle breathing levitation
      bookGroup.position.y = THREE.MathUtils.lerp(
        bookGroup.position.y,
        Math.sin(elapsedTime * 1.8) * 0.04,
        0.06,
      );
      ribbon.rotation.z = Math.sin(elapsedTime * 2.2) * 0.015;

      renderer.render(scene, camera);
    };

    animate();

    // 8. Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!mount) return;
      const newWidth = mount.clientWidth;
      const newHeight = mount.clientHeight;
      if (newWidth > 0 && newHeight > 0) {
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      }
    });
    resizeObserver.observe(mount);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      mount.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      mount.removeEventListener('mouseleave', onMouseLeave);

      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      backCoverGeo.dispose();
      spineGeo.dispose();
      pagesGeo.dispose();
      ribbonGeo.dispose();
      frontCoverGeo.dispose();
      ribGeo.dispose();
      coverTextures.color?.dispose();
      coverTextures.bump?.dispose();
      backCoverTexture?.dispose();
      spineTexture?.dispose();
      insideCoverTexture?.dispose();
      rightPageTexture?.dispose();
      giltEdgeTexture?.dispose();
      foreEdgeTexture?.dispose();
      shadowTexture?.dispose();
    };
  }, []);

  return (
    <div className="three-book-stage">
      <div
        ref={mountRef}
        className={`three-book-canvas ${isInteracting ? 'is-dragging' : ''}`}
        title="3D Archival Volume • Click to open • Drag to rotate"
      />
    </div>
  );
};
