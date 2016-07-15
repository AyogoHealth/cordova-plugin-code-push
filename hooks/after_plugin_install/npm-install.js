#!/usr/bin/env node

var exec = require('child_process').exec;
child = exec('npm install').stderr.pipe(process.stderr);
