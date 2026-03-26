import Patient from '../models/Patient.js';
import User from '../models/User.js';
import { logAudit } from '../utils/auditLogger.js';

const calculateAge = (dob) => {
  if (!dob) return null;

  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
};

const parseAllergies = (allergies) => {
  if (Array.isArray(allergies)) {
    return allergies.filter(Boolean);
  }

  if (typeof allergies !== 'string') {
    return [];
  }

  return allergies
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseStringList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => `${item}`.trim()).filter(Boolean);
  }

  if (typeof value !== 'string') {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseOptionalPositiveNumber = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

const parseRequiredPositiveNumber = (value, fieldLabel) => {
  if (value === undefined || value === null || value === '') {
    return {
      value: null,
      error: `${fieldLabel} is required`
    };
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return {
      value: null,
      error: `${fieldLabel} must be a positive number`
    };
  }

  return {
    value: parsed,
    error: null
  };
};

const buildPatientSummary = (patient) => ({
  id: patient._id,
  fullName: patient.fullName,
  govtId: patient.govtId,
  dob: patient.dob,
  nfcId: patient.nfcUuid,
  phone: patient.phone,
  age: patient.age,
  gender: patient.gender,
  bloodGroup: patient.bloodGroup,
  heightCm: patient.heightCm,
  weightKg: patient.weightKg,
  allergies: patient.allergies,
  surgeries: patient.surgeries,
  emergencyContact: patient.emergencyContact
});

// 🟢 CREATE PATIENT PROFILE
export const createPatientProfile = async (req, res) => {
  try {
    const existingPatient = await Patient.findOne({ user: req.user._id });
    if (existingPatient) {
      return res.status(400).json({
        message: 'Patient profile already exists'
      });
    }

    const heightCm = parseOptionalPositiveNumber(req.body.heightCm);
    const weightKg = parseOptionalPositiveNumber(req.body.weightKg);
    const age = req.body.age ?? calculateAge(req.body.dob);

    if (age === null || age < 0) {
      return res.status(400).json({
        message: 'A valid date of birth is required'
      });
    }

    const patient = await Patient.create({
      user: req.user._id,
      ...req.body,
      age,
      dob: new Date(req.body.dob),
      heightCm,
      weightKg,
      allergies: parseAllergies(req.body.allergies),
      surgeries: parseStringList(req.body.surgeries)
    });

    res.status(201).json({
      message: 'Patient profile created successfully',
      patient
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Server error while creating patient profile'
    });
  }
};

// 🔵 GET OWN PATIENT PROFILE
export const getMyPatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id }).populate(
      'user',
      'name username role'
    );

    if (!patient) {
      return res.status(404).json({
        message: 'Patient profile not found'
      });
    }

    res.json(patient);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Server error while fetching patient profile'
    });
  }
};

// 🟡 UPDATE OWN PATIENT PROFILE
export const updateMyPatientProfile = async (req, res) => {
  try {
    const age = req.body.dob ? calculateAge(req.body.dob) : undefined;
    const updates = {
      ...req.body,
      heightCm: parseOptionalPositiveNumber(req.body.heightCm),
      weightKg: parseOptionalPositiveNumber(req.body.weightKg),
      allergies: req.body.allergies === undefined ? undefined : parseAllergies(req.body.allergies),
      surgeries: req.body.surgeries === undefined ? undefined : parseStringList(req.body.surgeries)
    };

    if (age !== undefined) {
      if (age === null || age < 0) {
        return res.status(400).json({
          message: 'A valid date of birth is required'
        });
      }

      updates.age = age;
    }

    Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);

    const patient = await Patient.findOneAndUpdate(
      { user: req.user._id },
      updates,
      { returnDocument: 'after', runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({
        message: 'Patient profile not found'
      });
    }

    res.json({
      message: 'Patient profile updated successfully',
      patient
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Server error while updating patient profile'
    });
  }
};

export const registerPatientByHospital = async (req, res) => {
  try {
    const {
      fullName,
      dob,
      gender,
      phone,
      email,
      bloodGroup,
      emergencyName,
      emergencyPhone,
      allergies,
      surgeries,
      heightCm,
      weightKg,
      nfcId,
      govtId,
      address,
      hospitalId
    } = req.body;

    if (!fullName || !dob || !gender || !phone || !bloodGroup || !nfcId) {
      return res.status(400).json({
        message: 'Full name, DOB, gender, phone, blood group, and NFC ID are required'
      });
    }

    const age = calculateAge(dob);
    if (age === null || age < 0) {
      return res.status(400).json({
        message: 'A valid date of birth is required'
      });
    }

    const parsedHeightCm = parseRequiredPositiveNumber(heightCm, 'Height (cm)');
    if (parsedHeightCm.error) {
      return res.status(400).json({ message: parsedHeightCm.error });
    }

    const parsedWeightKg = parseRequiredPositiveNumber(weightKg, 'Weight (kg)');
    if (parsedWeightKg.error) {
      return res.status(400).json({ message: parsedWeightKg.error });
    }

    const existingPhonePatient = await Patient.findOne({ phone });
    if (existingPhonePatient) {
      return res.status(409).json({ message: 'A patient with this phone already exists' });
    }

    const existingNfcPatient = await Patient.findOne({ nfcUuid: nfcId });
    if (existingNfcPatient) {
      return res.status(409).json({ message: 'This NFC card is already linked to another patient' });
    }

    const usernameBase = `patient_${phone.replace(/\D/g, '').slice(-10) || Date.now()}`;
    let username = usernameBase;
    let suffix = 1;

    while (await User.findOne({ username })) {
      username = `${usernameBase}_${suffix}`;
      suffix += 1;
    }

    const user = await User.create({
      name: fullName,
      username,
      email: email || null,
      password: `${phone.replace(/\D/g, '').slice(-6) || 'smartid'}!`,
      role: 'patient'
    });

    const patient = await Patient.create({
      user: user._id,
      nfcUuid: nfcId,
      fullName,
      govtId: govtId || null,
      dob: new Date(dob),
      age,
      gender,
      bloodGroup,
      heightCm: parsedHeightCm.value,
      weightKg: parsedWeightKg.value,
      phone,
      address: address || '',
      emergencyContact: {
        name: emergencyName || '',
        phone: emergencyPhone || ''
      },
      allergies: parseAllergies(allergies),
      surgeries: parseStringList(surgeries)
    });

    await logAudit({
      actor: hospitalId || req.user.id,
      actorRole: req.user.role,
      action: 'REGISTER_PATIENT',
      patient: patient._id,
      resource: 'PATIENT_PROFILE',
      ipAddress: req.ip
    });

    res.status(201).json({
      message: 'Patient registered successfully',
      patientId: patient._id,
      fullName: patient.fullName,
      nfcId: patient.nfcUuid,
      username: user.username,
      temporaryPasswordHint: 'Last 6 digits of phone + !'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Server error while registering patient'
    });
  }
};

export const getMyPatientEMR = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user.id }).populate('user', 'name username role');

    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const visits = (patient.medicalHistory || []).map((entry) => ({
      hospital: 'Unified Care Network',
      doctor: 'Assigned Care Team',
      date: entry.diagnosedDate || patient.updatedAt,
      summary: entry.notes || entry.condition || 'Medical record updated',
      category: entry.condition || 'General'
    }));

    res.json({
      patient: buildPatientSummary(patient),
      visits
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching EMR' });
  }
};

export const getMyPatientRecords = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user.id }).populate('user', 'name username role');

    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    res.json({
      patient: buildPatientSummary(patient),
      records: patient.medicalHistory || []
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching patient records' });
  }
};

export const getMyPatientPrescriptions = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user.id });

    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const prescriptions = (patient.medicalHistory || []).slice(0, 5).map((entry, index) => ({
      id: `${patient._id}-${index + 1}`,
      name: entry.condition || `Prescription ${index + 1}`,
      notes: entry.notes || 'No additional notes',
      issuedAt: entry.diagnosedDate || patient.updatedAt
    }));

    res.json({ prescriptions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching prescriptions' });
  }
};

export const addClinicalNote = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.patientId);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const note = {
      condition: req.body.mode === 'EMERGENCY' ? 'Emergency intervention' : 'Clinical note',
      diagnosedDate: req.body.timestamp || new Date(),
      notes: req.body.content
    };

    patient.medicalHistory = [...(patient.medicalHistory || []), note];
    await patient.save();

    await logAudit({
      actor: req.user.id,
      actorRole: req.user.role,
      action: req.body.mode === 'EMERGENCY' ? 'EMERGENCY_CLINICAL_NOTE' : 'ADD_CLINICAL_NOTE',
      patient: patient._id,
      resource: 'EMR_NOTE',
      ipAddress: req.ip
    });

    res.status(201).json({
      message: 'Clinical note saved',
      patient: buildPatientSummary(patient),
      note
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while saving clinical note' });
  }
};
