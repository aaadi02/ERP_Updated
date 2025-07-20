  import mongoose from 'mongoose';
const auditSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g. "Expense Approved"
  entityType: { type: String, required: true }, // e.g. "Expense"
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  user: { type: String }, // or userId if you have auth
  details: { type: String }, // optional: extra info
  timestamp: { type: Date, default: Date.now },
  actionId: { type: String } // identifier for each action (not unique to allow duplicates)
});

// Create non-unique index for performance only (no unique constraints)
auditSchema.index({ 
  action: 1, 
  entityType: 1, 
  entityId: 1, 
  timestamp: -1 
});

// Non-unique index on actionId for performance
auditSchema.index({ actionId: 1 });
export default mongoose.model('Audit', auditSchema);
