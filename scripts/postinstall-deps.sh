#!/bin/bash

# N.B. REQUIRES INSTALL AT ROOT

PACKAGE_ROOT_DIR=${PWD};
SCRIPT_DIR=$(dirname $0);

# change to script location
cd $SCRIPT_DIR;
# change to root dir
cd ../;

# required dependencies for twilio build and deploy, etc. commands
REQUIRED_DEPENDENCY_DIRS=(
  "node_modules/@twilio/flex-ui/package.json"
  "node_modules/react-dom/package.json"
  "node_modules/react/package.json"
);

for dir in "${REQUIRED_DEPENDENCY_DIRS[@]}"; do
    REQUIRED_DEPENDENCY_DIR="$(dirname "$dir")";
    REQUIRED_DEPENDENCY_FILE="$(basename "$dir")";

    PACKAGE_DEPENDENCY_DIR="$PACKAGE_ROOT_DIR/$REQUIRED_DEPENDENCY_DIR/";

    mkdir -p $PACKAGE_DEPENDENCY_DIR;
    cp "$dir" "$PACKAGE_DEPENDENCY_DIR/$REQUIRED_DEPENDENCY_FILE";
done;