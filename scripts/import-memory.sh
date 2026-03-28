#!/bin/bash
# Import workspace markdown files into RAG
WORKSPACE="/home/hermitwang/.openclaw/workspace"
API_URL="http://localhost:3000/api/v1/rag/knowledge"
OWNER_ID="hermit-workspace"

files=(
  "MEMORY.md"
  "USER.md"
  "SOUL.md"
  "IDENTITY.md"
  "AGENTS.md"
  "TOOLS.md"
  "customer-档案.md"
)

for f in "${files[@]}"; do
  if [ -f "$WORKSPACE/$f" ]; then
    content=$(cat "$WORKSPACE/$f" | jq -Rs .)
    response=$(curl -s -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -d "{\"ownerId\":\"$OWNER_ID\",\"content\":$content,\"filename\":\"$f\",\"fileType\":\"text/markdown\",\"tags\":[\"workspace\"]}")
    success=$(echo "$response" | jq -r '.success // "false"')
    echo "$f: $success"
  fi
done

echo ""
echo "=== Memory files imported ==="
curl -s "http://localhost:3000/api/v1/rag/knowledge/$OWNER_ID" | jq '.count'