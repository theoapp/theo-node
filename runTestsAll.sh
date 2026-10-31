#!/usr/bin/env bash
set -e

echo "### running docker tests"
./runTestsDocker.sh
echo "### running docker cluster tests"
./runTestsCluster.sh skip_build
echo "### running docker db upgrade tests"
./runTestsUpgrade.sh skip_build
echo "### running docker multi-instances tests"
./runTestsMultiInstances.sh skip_build
