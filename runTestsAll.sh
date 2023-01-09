#!/usr/bin/env bash
set -e
./runTestsDocker.sh
./runTestsCluster.sh skip_build
./runTestsUpgrade.sh skip_build
./runTestsMultiInstances.sh skip_build
