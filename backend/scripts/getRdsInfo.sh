#!/bin/bash
# Get RDS connection info from AWS

echo "=== Finding RDS Database Information ==="
echo ""

# Try to get RDS info via AWS CLI
if command -v aws &> /dev/null; then
  echo "Checking AWS RDS instances..."
  
  # Try different regions
  for region in eu-west-1 us-east-1 us-west-2; do
    echo "Checking region: $region"
    RDS_INFO=$(aws rds describe-db-instances --region "$region" --query 'DBInstances[*].[DBInstanceIdentifier,Endpoint.Address,Endpoint.Port,MasterUsername,DBName]' --output text 2>/dev/null)
    
    if [ -n "$RDS_INFO" ]; then
      echo ""
      echo "Found RDS instance(s) in $region:"
      echo "$RDS_INFO" | while read -r identifier endpoint port username dbname; do
        echo "  Instance: $identifier"
        echo "  Endpoint: $endpoint"
        echo "  Port: $port"
        echo "  Username: $username"
        echo "  Database: $dbname"
        echo ""
        echo "To construct DATABASE_URL, you'll need:"
        echo "  1. The password (check EB env vars or RDS console)"
        echo "  2. Then set:"
        echo "     export DATABASE_URL=\"postgres://$username:PASSWORD@$endpoint:$port/$dbname?sslmode=require\""
        echo ""
      done
      break
    fi
  done
else
  echo "AWS CLI not found. Install it with: brew install awscli"
  echo ""
fi

echo "Alternative: Check EB environment for individual DB variables:"
eb printenv | grep -iE "DB_|RDS_|DATABASE" | grep -v "DATABASE_URL"

echo ""
echo "Or check AWS Console:"
echo "  https://console.aws.amazon.com/rds/ → Databases → Your DB → Connectivity & security"
