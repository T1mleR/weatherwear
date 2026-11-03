# WeatherWear on AWS Free Account — CloudFormation

Status: CloudFormation code is prepared. **NO AWS resources have been provisioned.**
Live first deployment remains on Render: https://weatherwear-app.onrender.com

This is a **single-server educational demo**, not a fault-tolerant commercial deployment. The existing root Docker Compose runs the frontend/API, PostgreSQL, and one-shot migrations together on EC2.

## 1. Check the AWS Free Account BEFORE launching anything

1. Open https://aws.amazon.com/free/ and select the **Free account plan** (not Paid / Advanced).
2. Confirm in Billing that the plan really says Free, view remaining credits and expiry. The new Free plan normally gives an eligible new customer $100 and lasts up to six months or until credits run out.
3. Review Free Tier and account-level spend limits in AWS Settings. Configure a strict spend limit if the interface supports it. AWS Budgets alerts are NOT hard spending caps; AWS billing data may be delayed.
4. Set AWS Region to **Europe (Frankfurt), eu-central-1**. Confirm the actual account permits EC2 t3.micro, encrypted gp3 EBS, public IPv4, IAM/SSM, CloudFormation, and AWS Budgets. All resources can consume Free Plan credits. Never upgrade to Paid for an access error.
5. Do not enable AWS Organizations, Control Tower, reserved capacity, advanced paid monitoring, NAT gateway or load balancer.

Official references:
- https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier-plans.html
- https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-free-tier-usage.html
- https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-best-practices.html

## 2. Architecture and cost controls

Files:
- [CloudFormation template](../infra/aws/cloudformation.yaml)
- [EC2 bootstrap script](../infra/aws/bootstrap.sh)
- [AWS Docker Compose resource limits](../infra/aws/docker-compose.aws.yml)

Stack creates: one VPC with a public subnet, route and security group; one t3.micro Amazon Linux 2023 EC2 instance (standard CPU credits, IMDSv2 enforced, 20 GiB encrypted gp3 EBS); an instance role limited to the AWS SSM managed policy; and a monthly $5 gross-cost AWS Budgets email alert at 20%/80%.

No inbound SSH and no public PostgreSQL port. HTTP port 80 is public. App and DB run as Docker Compose services on the single host, with CPU/RAM limits. DB password is randomly generated on the machine and stored in a root-readable-only .env file; it does not appear in CloudFormation or GitHub.

Optional CloudFront viewer HTTPS is OFF by default. Before turning it on, confirm it is permitted under your AWS Free plan and credits. CloudFront-to-origin traffic would still use HTTP. This educational small-server design is NOT high availability and is not end-to-end TLS.

## 3. Validate before deployment

GitHub Actions validates CloudFormation, the bootstrap script and the Compose overlay without AWS resources.

Commands for local validation:

    python3 -m pip install "cfn-lint>=1,<2"
    cfn-lint infra/aws/cloudformation.yaml
    bash -n infra/aws/bootstrap.sh
    POSTGRES_PASSWORD=ci-validation-only docker compose -f docker-compose.yml -f infra/aws/docker-compose.aws.yml config -q

GitHub Actions workflow: [AWS template static checks](../.github/workflows/aws-template-checks.yml).

## 4. Create stack only after Free plan and budget checks

1. AWS Console -> Europe (Frankfurt) -> CloudFormation -> Create stack -> With new resources -> Upload template file. Use infra/aws/cloudformation.yaml.
2. Stack name: weatherwear-coursework-free.
3. SourceRef: preferably use a tested current commit SHA that contains this CloudFormation template and bootstrap script. A feature branch is acceptable for initial testing.
4. BudgetAlertEmail: your own address, entered privately in AWS only.
5. EnableCloudFront: false for first HTTP demo. Enable later ONLY after reviewing free eligibility and credit usage.
6. Review resource types/estimated credit consumption. Accept the IAM capabilities acknowledgment if requested for the EC2 SSM role. Click Submit only after reviewing that this is a Free Plan account.

When CREATE_COMPLETE, open Outputs for InstanceId and InitialHttpUrl. An optional HttpsDemoUrl is emitted when CloudFront is enabled.

Important: CloudFormation can say CREATE_COMPLETE before cloud-init has completed the Docker build. In Systems Manager Session Manager, check:

    sudo cat /var/log/weatherwear-init.log
    sudo cat /var/log/weatherwear-compose-status.log
    sudo cat /var/log/weatherwear-compose.log
    curl -f http://127.0.0.1/api/health

Then test searching Алматы and refreshing saved history. Do not share database credentials or full environment variables.

## 5. CI/CD and submission proof

The existing GitHub workflow already tests frontend/backend, PostgreSQL integration, Playwright and Docker Compose. AWS deployment is deliberately manual until Free Plan limits and role permissions are confirmed. For push-to-deploy, add a least-privilege GitHub OIDC role plus an SSM deployment command after this initial stack passes. Never store AWS access keys in GitHub.

Record in GitHub Issue #15: stack CREATE_COMPLETE, resource list, EC2 type, public app URL, health check, Compose services, weather search, data persistence, Free account credit balance, and any CloudFront endpoint (without sensitive details).

## 6. Clean up to avoid credit consumption

After demonstration: CloudFormation -> select weatherwear-coursework-free -> Delete. Verify DELETE_COMPLETE and that the instance/EBS/CloudFront resources were removed. Back up Postgres records first; deleting the root volume destroys the local data. Stopping EC2 alone does not eliminate EBS/storage costs. CloudFormation has no separate service fee but the resources it creates consume credits.

## Checklist

- [x] CloudFormation, Compose and resource caps prepared in GitHub
- [x] Automated static validation configured
- [ ] Confirm actual AWS Free plan and credit balance
- [ ] Deploy CloudFormation stack after authorization
- [ ] Test AWS URL, Next.js API, PostgreSQL persistence
- [ ] Verify cleanup and costs
- [ ] Add AWS-specific CI-gated redeployment, if required
