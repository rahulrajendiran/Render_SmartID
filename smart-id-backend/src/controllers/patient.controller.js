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
    const userId = req.user._id || req.user.id;
    const patient = await Patient.findOne({ user: userId }).populate('user', 'name username role');

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
    const userId = req.user._id || req.user.id;
    const patient = await Patient.findOne({ user: userId }).populate('user', 'name username role');

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
    const userId = req.user._id || req.user.id;
    const patient = await Patient.findOne({ user: userId });

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
    const userId = req.user._id || req.user.id;
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
      actor: userId,
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

export const exportPatientPDF = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const patient = await Patient.findOne({ user: userId }).populate('user', 'name username email role');

    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const pdfBuffer = buildPatientPDF(patient);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="smart-id-profile-${patient._id}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to export patient PDF' });
  }
};

export const exportMedicalHistoryPDF = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const patient = await Patient.findOne({ user: userId }).populate('user', 'name username email role');

    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const pdfBuffer = buildMedicalHistoryPDF(patient);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="smart-id-medical-history-${patient._id}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to export medical history PDF' });
  }
};

const buildPatientPDF = (patient) => {
  const escapePdfText = (value) => String(value || 'N/A')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

  const content = [
    'BT',
    '/F1 18 Tf',
    '50 760 Td',
    `(${escapePdfText('Smart-ID Patient Profile')}) Tj`,
    '/F1 12 Tf',
    '0 -30 Td',
    `(${escapePdfText('Generated: ' + new Date().toLocaleString())}) Tj`,
    '0 -30 Td',
    '0 -20 Td',
    `(${escapePdfText('Full Name: ' + patient.fullName)}) Tj`,
    '0 -20 Td',
    `(${escapePdfText('Health ID: ' + (patient.user?.username || 'N/A'))}) Tj`,
    '0 -20 Td',
    `(${escapePdfText('Date of Birth: ' + (patient.dob ? new Date(patient.dob).toLocaleDateString() : 'N/A'))}) Tj`,
    '0 -20 Td',
    `(${escapePdfText('Age: ' + patient.age + ' years')}) Tj`,
    '0 -20 Td',
    `(${escapePdfText('Gender: ' + patient.gender)}) Tj`,
    '0 -20 Td',
    `(${escapePdfText('Blood Group: ' + patient.bloodGroup)}) Tj`,
    '0 -30 Td',
    `(${escapePdfText('Contact Information')}) Tj`,
    '0 -20 Td',
    `(${escapePdfText('Phone: ' + patient.phone)}) Tj`,
    '0 -20 Td',
    `(${escapePdfText('Email: ' + (patient.user?.email || 'N/A'))}) Tj`,
    '0 -20 Td',
    `(${escapePdfText('Address: ' + patient.address)}) Tj`,
    '0 -30 Td',
    `(${escapePdfText('Emergency Contact')}) Tj`,
    '0 -20 Td',
    `(${escapePdfText('Name: ' + (patient.emergencyContact?.name || 'N/A'))}) Tj`,
    '0 -20 Td',
    `(${escapePdfText('Phone: ' + (patient.emergencyContact?.phone || 'N/A'))}) Tj`,
    '0 -30 Td',
    `(${escapePdfText('Medical Information')}) Tj`,
    '0 -20 Td',
    `(${escapePdfText('Allergies: ' + (patient.allergies?.join(', ') || 'None'))}) Tj`,
    '0 -20 Td',
    `(${escapePdfText('Surgeries: ' + (patient.surgeries?.join(', ') || 'None'))}) Tj`,
    '0 -20 Td',
    `(${escapePdfText('Height: ' + (patient.heightCm ? patient.heightCm + ' cm' : 'N/A'))}) Tj`,
    '0 -20 Td',
    `(${escapePdfText('Weight: ' + (patient.weightKg ? patient.weightKg + ' kg' : 'N/A'))}) Tj`,
    '0 -40 Td',
    '/F1 10 Tf',
    `(${escapePdfText('This document was generated by Smart-ID Healthcare Platform.')}) Tj`,
    '0 -15 Td',
    `(${escapePdfText('For any queries, contact support@smart-id.health')}) Tj`,
    'ET'
  ].join('\n');

  return generatePDFDocument(content);
};

const buildMedicalHistoryPDF = (patient) => {
  const escapePdfText = (value) => String(value || 'N/A')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

  const medicalHistory = patient.medicalHistory || [];
  let yOffset = 760;
  const lineHeight = 20;
  const content = ['BT', '/F1 18 Tf', '50 ' + yOffset + ' Td', '(${escapePdfText(\'Smart-ID Medical History\')}) Tj'];

  yOffset -= 30;
  content.push('/F1 12 Tf', '0 ' + yOffset + ' Td', `(${escapePdfText('Patient: ' + patient.fullName)}) Tj`);
  yOffset -= 20;
  content.push('0 ' + yOffset + ' Td', `(${escapePdfText('Health ID: ' + (patient.user?.username || 'N/A'))}) Tj`);
  yOffset -= 20;
  content.push('0 ' + yOffset + ' Td', `(${escapePdfText('Generated: ' + new Date().toLocaleString())}) Tj`);

  yOffset -= 40;
  content.push('/F1 14 Tf', '0 ' + yOffset + ' Td', `(${escapePdfText('Medical Records (' + medicalHistory.length + ')')}) Tj`);

  if (medicalHistory.length === 0) {
    yOffset -= lineHeight;
    content.push('/F1 12 Tf', '0 ' + yOffset + ' Td', `(${escapePdfText('No medical history records found.')}) Tj`);
  } else {
    medicalHistory.forEach((record, index) => {
      yOffset -= lineHeight;
      if (yOffset < 100) return;

      content.push('/F1 12 Tf', '0 ' + yOffset + ' Td', `(${escapePdfText((index + 1) + '. ' + (record.condition || 'Clinical Note'))}) Tj`);
      yOffset -= lineHeight;
      content.push('0 ' + yOffset + ' Td', `(${escapePdfText('Date: ' + (record.diagnosedDate ? new Date(record.diagnosedDate).toLocaleDateString() : 'N/A'))}) Tj`);
      yOffset -= lineHeight;
      content.push('0 ' + yOffset + ' Td', `(${escapePdfText('Notes: ' + (record.notes || 'No additional notes'))}) Tj`);
      yOffset -= 10;
    });
  }

  yOffset -= 40;
  content.push('/F1 10 Tf', '0 ' + yOffset + ' Td', `(${escapePdfText('This document was generated by Smart-ID Healthcare Platform.')}) Tj`);
  yOffset -= 15;
  content.push('0 ' + yOffset + ' Td', `(${escapePdfText('For any queries, contact support@smart-id.health')}) Tj`);
  content.push('ET');

  return generatePDFDocument(content.join('\n'));
};

const generatePDFDocument = (content) => {
  const objects = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  objects.push('2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj');
  objects.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj');
  objects.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');
  objects.push(`5 0 obj\n<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream\nendobj`);

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${obj}\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'utf8');
};
