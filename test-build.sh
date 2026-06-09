set -euo pipefail
IFS=$'\n\t'
echo $BRANCH_NAME
tagName=${TAG_NAME:-$BRANCH_NAME}
echo $tagName
tag="us-docker.pkg.dev/${PROJECT_ID}/${_ORG_NAME}/${_IMAGE_NAME}:${tagName}"
echo $tag
docker buildx build --attest=type=sbom,mode=max --tag=$tag --file=./Dockerfile . 