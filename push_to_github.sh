#!/bin/bash

# LifeStraw Blockchain - Push to GitHub
# Run this script to push to GitHub

cd /Users/yangyuqing/Desktop/blockchain

echo "🚀 Pushing LifeStraw Blockchain to GitHub..."
echo ""

# Check if authenticated
if ! gh auth status &>/dev/null; then
    echo "⚠️  Need to authenticate with GitHub first..."
    echo "   Run: gh auth login --git-protocol ssh"
    echo "   Then run this script again!"
    exit 1
fi

# Create repo and push
echo "📦 Creating GitHub repository..."
gh repo create LifeStraw-Blockchain \
    --public \
    --source=. \
    --remote=origin \
    --description "LifeStraw Digital Verification Blockchain - Hyperledger Fabric-based traceability system"

if [ $? -eq 0 ]; then
    echo "✅ Repo created!"
    echo ""
    echo "📤 Pushing code..."
    git branch -M main
    git push -u origin main
    echo ""
    echo "🎉 Done! Repo: https://github.com/yyqfrank420/LifeStraw-Blockchain"
else
    echo "❌ Failed to create repo. Check authentication."
    exit 1
fi

