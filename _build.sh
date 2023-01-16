#!/bin/sh

mkdir -p Release
rm -f Release/*
DistributionTool -b -i com.mairlist.automation.sdPlugin -o Release
