#!/bin/bash
mkdir -p /tmp/dejs/
filename=$(basename "$1")
cp $1 /tmp/dejs/
webcrack -m /tmp/dejs/$filename > $1
./de.js -v --cleanup-functions comment -f $1