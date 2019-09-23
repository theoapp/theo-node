#!/usr/bin/env bash
./runTestsDocker.sh
RETVAL=$?
if [[ ${RETVAL} -gt 0 ]]; then
    exit ${RETVAL}
fi
./runTestsCluster.sh skip_build
RETVAL=$?
if [[ ${RETVAL} -gt 0 ]]; then
    exit ${RETVAL}
fi
./runTestsUpgrade.sh
RETVAL=$?
exit ${RETVAL}
