import mongoose from 'mongoose';

const namePoolSchema = new mongoose.Schema({
  _id: String,
  unassigned: [{
    name: String,
    email: String,
    drive_link: String,
    description: String
  }]
});

export default mongoose.models.NamePool || mongoose.model('NamePool', namePoolSchema);