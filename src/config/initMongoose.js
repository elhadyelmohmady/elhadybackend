import mongoose from 'mongoose';
import softDeletePlugin from './softDeletePlugin.js';

mongoose.plugin(softDeletePlugin);
