
dir_path=$(dirname $0)
PACKAGE_VERSION=$(${dir_path}/getVersion.sh)

sed -i '' 's/org.opencontainers.image.version=.*/org.opencontainers.image.version="'"${PACKAGE_VERSION}"'" \\/' Dockerfile

git add Dockerfile
