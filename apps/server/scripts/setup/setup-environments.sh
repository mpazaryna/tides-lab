#!/bin/bash

# Setup script for Tides environments
# This script creates D1 databases and KV namespaces for all environments

echo "🚀 Setting up Tides environments (tides-001, tides-002, tides-003)"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to update wrangler.toml with resource IDs
update_wrangler_config() {
    local env=$1
    local resource_type=$2
    local resource_name=$3
    local resource_id=$4
    
    echo "Updating wrangler.toml for $env $resource_type: $resource_name = $resource_id"
    
    # This would need to be done manually or with a more sophisticated script
    echo "⚠️  Please manually update wrangler.toml with:"
    echo "   $resource_type $resource_name ID for $env: $resource_id"
}

# Create D1 Databases
echo -e "${YELLOW}Creating D1 Databases...${NC}"
echo ""

for env in "001" "002" "003"; do
    echo "Creating tides-${env}-db..."
    output=$(npm run db:create:${env} 2>&1)
    
    if echo "$output" | grep -q "Created new D1 database"; then
        db_id=$(echo "$output" | grep -oE '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}' | head -1)
        echo -e "${GREEN}✓ Created tides-${env}-db with ID: $db_id${NC}"
        update_wrangler_config "tides-${env}" "D1" "tides-${env}-db" "$db_id"
    else
        echo -e "${RED}✗ Failed to create tides-${env}-db${NC}"
        echo "$output"
    fi
    echo ""
done

# Create KV Namespaces
echo -e "${YELLOW}Creating KV Namespaces...${NC}"
echo ""

# Note: KV namespace creation needs to be done one at a time
for env in "001" "002" "003"; do
    echo "Creating KV namespaces for tides-${env}..."
    
    # Create TIDES_KV
    echo "  Creating TIDES_KV..."
    output=$(WRANGLER_LOG_PATH=./logs wrangler kv:namespace create TIDES_KV --env tides-${env} 2>&1)
    if echo "$output" | grep -q "id ="; then
        kv_id=$(echo "$output" | grep -oE 'id = "[^"]*"' | cut -d'"' -f2)
        echo -e "${GREEN}  ✓ Created TIDES_KV with ID: $kv_id${NC}"
        update_wrangler_config "tides-${env}" "KV" "TIDES_KV" "$kv_id"
    else
        echo -e "${RED}  ✗ Failed to create TIDES_KV${NC}"
    fi
    
    # Create API_KEYS
    echo "  Creating API_KEYS..."
    output=$(WRANGLER_LOG_PATH=./logs wrangler kv:namespace create API_KEYS --env tides-${env} 2>&1)
    if echo "$output" | grep -q "id ="; then
        kv_id=$(echo "$output" | grep -oE 'id = "[^"]*"' | cut -d'"' -f2)
        echo -e "${GREEN}  ✓ Created API_KEYS with ID: $kv_id${NC}"
        update_wrangler_config "tides-${env}" "KV" "API_KEYS" "$kv_id"
    else
        echo -e "${RED}  ✗ Failed to create API_KEYS${NC}"
    fi
    
    # Create API_KEY_USAGE
    echo "  Creating API_KEY_USAGE..."
    output=$(WRANGLER_LOG_PATH=./logs wrangler kv:namespace create API_KEY_USAGE --env tides-${env} 2>&1)
    if echo "$output" | grep -q "id ="; then
        kv_id=$(echo "$output" | grep -oE 'id = "[^"]*"' | cut -d'"' -f2)
        echo -e "${GREEN}  ✓ Created API_KEY_USAGE with ID: $kv_id${NC}"
        update_wrangler_config "tides-${env}" "KV" "API_KEY_USAGE" "$kv_id"
    else
        echo -e "${RED}  ✗ Failed to create API_KEY_USAGE${NC}"
    fi
    
    echo ""
done

# Create R2 Buckets
echo -e "${YELLOW}Creating R2 Buckets...${NC}"
echo ""

for env in "001" "002" "003"; do
    bucket_name="tides-${env}-storage"
    echo "Creating R2 bucket: $bucket_name..."
    output=$(WRANGLER_LOG_PATH=./logs wrangler r2 bucket create $bucket_name 2>&1)
    
    if echo "$output" | grep -q "Created bucket"; then
        echo -e "${GREEN}✓ Created R2 bucket: $bucket_name${NC}"
    else
        echo -e "${YELLOW}⚠️  R2 bucket might already exist or creation failed${NC}"
    fi
    echo ""
done

echo -e "${YELLOW}📋 Next Steps:${NC}"
echo ""
echo "1. Update wrangler.toml with the generated IDs shown above"
echo ""
echo "2. Set secrets for each environment:"
echo "   npm run secret:set:001"
echo "   npm run secret:set:002"
echo "   npm run secret:set:003"
echo ""
echo "3. Initialize D1 databases with schema:"
echo "   npx wrangler d1 execute tides-001-db --file=src/db/schema.sql --env tides-001"
echo "   npx wrangler d1 execute tides-002-db --file=src/db/schema.sql --env tides-002"
echo "   npx wrangler d1 execute tides-003-db --file=src/db/schema.sql --env tides-003"
echo ""
echo "4. Deploy to environments:"
echo "   npm run deploy:dev      # Deploy to tides-001"
echo "   npm run deploy:staging  # Deploy to tides-002"
echo "   npm run deploy:prod     # Deploy to tides-003"
echo ""
echo -e "${GREEN}✨ Environment setup complete!${NC}"