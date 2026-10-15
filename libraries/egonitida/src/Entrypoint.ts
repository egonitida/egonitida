#!/usr/bin/env node
import { program } from '#src/Program.ts';
import { NodeRuntime } from '@effect/platform-node';

NodeRuntime.runMain(program);
