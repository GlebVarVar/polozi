#!/bin/bash
set -e

# Load .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Validate
for var in FTP_HOST FTP_USER FTP_PASS FTP_PATH; do
  if [ -z "${!var}" ]; then
    echo "Error: $var is not set in .env"
    exit 1
  fi
done

echo "Building..."
pnpm build

echo "Deploying to $FTP_HOST:$FTP_PATH..."
lftp -u "$FTP_USER","$FTP_PASS" "$FTP_HOST" -e "
  set ftp:passive-mode on
  mirror -R --delete --verbose --exclude-glob .envrc --exclude-glob .well-known out/ $FTP_PATH/
  quit
"

echo "Done!"
