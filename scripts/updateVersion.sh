
PACKAGE_VERSION=$(npm -s run ver)

echo "New version: $PACKAGE_VERSION"

if [ "" = "$PACKAGE_VERSION" ]; then
  echo Something went wrong. Empty version
  exit 1
fi

sed -i '' 's/org.opencontainers.image.version=.*/org.opencontainers.image.version="'"${PACKAGE_VERSION}"'" \\/' Dockerfile

git add Dockerfile
