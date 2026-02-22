#!/usr/bin/env node
import { runMain } from 'citty';
import { main } from '../esm/cli/index.js';
runMain(main).catch(console.error);
