require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI not set in environment');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for migration');

    const submitColl = mongoose.connection.collection('submits');
    const approveColl = mongoose.connection.collection('approves');

    // Rename submited_at -> submitted_at in submits
    const subRes = await submitColl.updateMany(
      { submited_at: { $exists: true } },
      { $rename: { 'submited_at': 'submitted_at' } }
    );
    console.log('submits updated:', subRes.modifiedCount);

    // Approve collection renames
    const appRes1 = await approveColl.updateMany(
      { task_submition_id: { $exists: true } },
      { $rename: { 'task_submition_id': 'task_submission_id' } }
    );
    console.log('approves task_submition_id renamed:', appRes1.modifiedCount);

    const appRes2 = await approveColl.updateMany(
      { submited_at: { $exists: true } },
      { $rename: { 'submited_at': 'submitted_at' } }
    );
    console.log('approves submited_at renamed:', appRes2.modifiedCount);

    const appRes3 = await approveColl.updateMany(
      { redeemed_point: { $exists: true } },
      { $rename: { 'redeemed_point': 'redeemed_points' } }
    );
    console.log('approves redeemed_point renamed:', appRes3.modifiedCount);

    console.log('Migration finished');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    process.exit(1);
  }
}

if (require.main === module) run();
