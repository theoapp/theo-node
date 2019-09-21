
PACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

sed -i '' 's/org.opencontainers.image.version=.*/org.opencontainers.image.version="'"${PACKAGE_VERSION}"'" \\/' Dockerfile

git add Dockerfile
