export default function softDeletePlugin(schema) {
    schema.add({
        deleteFlag: {
            type: Number,
            enum: [0, 1],
            default: 0
        }
    });

    const excludeDeleted = function(next) {
        if (!this.getOptions().includeDeleted) {
            // Apply deleteFlag: 0 if not explicitly querying it
            if (this.getQuery().deleteFlag === undefined) {
                this.where({ deleteFlag: { $ne: 1 } });
            }
        }
        next();
    };

    schema.pre('find', excludeDeleted);
    schema.pre('findOne', excludeDeleted);
    schema.pre('countDocuments', excludeDeleted);
    schema.pre('findOneAndUpdate', excludeDeleted);
    schema.pre('updateMany', excludeDeleted);
    schema.pre('updateOne', excludeDeleted);

    schema.pre('aggregate', function(next) {
        if (!this.options.includeDeleted) {
            const pipeline = this.pipeline();
            const hasDeleteFlagMatch = pipeline.some(
                stage => stage.$match && stage.$match.deleteFlag !== undefined
            );
            
            if (!hasDeleteFlagMatch) {
                pipeline.unshift({ $match: { deleteFlag: { $ne: 1 } } });
            }
        }
        next();
    });
}
