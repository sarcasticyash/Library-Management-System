# AWS Infrastructure as Code Directory

## Overview
This directory contains Infrastructure as Code (Terraform) modules for provisioning and managing AWS resources for the Library Management System.

## Contents (Planned)
```text
infrastructure/aws/
├── terraform/
│   ├── modules/
│   │   ├── vpc/                # Multi-AZ VPC (public, private, database subnets, NAT Gateways)
│   │   ├── eks/                # EKS Cluster, Managed Node Groups, OIDC Provider
│   │   ├── ecr/                # Private Container Registries with scanning & lifecycle rules
│   │   ├── iam/                # IAM Roles for Service Accounts (IRSA), Pod execution policies
│   │   ├── alb/                # AWS Application Load Balancer Controller prerequisites
│   │   └── cloudwatch/         # Container Insights, Log Groups, Metric Alarms
│   └── environments/
│       ├── dev/
│       ├── staging/
│       └── prod/
└── policy-templates/           # IAM least-privilege JSON policy definitions
```
