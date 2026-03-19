#!/bin/bash

echo "Starting multi-client deployment..."

ORIGINAL_REMOTE=$(git remote get-url origin)

jq -c '.[]' clients.json | while read client; do

  REPO=$(echo $client | jq -r '.repo')
  NAME=$(echo $client | jq -r '.name')
  EMAIL=$(echo $client | jq -r '.email')

  echo ""
  echo "-----------------------------------"
  echo "Deploying to: $REPO"
  echo "Author: $NAME <$EMAIL>"
  echo "-----------------------------------"

  git remote set-url origin $REPO
  git config user.name "$NAME"
  git config user.email "$EMAIL"

  git add .
  git commit --allow-empty -m "Deploy template update"

  git push origin main --force --progress

done

git remote set-url origin $ORIGINAL_REMOTE

echo ""
echo "All deployments complete."