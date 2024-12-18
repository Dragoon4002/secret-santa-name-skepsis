import mongoose from 'mongoose';

const SecretSantaSchema = new mongoose.Schema({
  user: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true
    }
  },
  assignedPerson: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    drive_link: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    }
  },
  assignmentDate: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.SecretSanta || mongoose.model('SecretSanta', SecretSantaSchema);