import jsPDF from 'jspdf';
import { PatientVisit, Patient } from '../types';

export const generateVisitReportPDF = (visit: PatientVisit, patient: Patient | null) => {
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Visit Report', pageWidth / 2, yPos, { align: 'center' });

  yPos += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: 'center' });

  yPos += 15;
  doc.setDrawColor(200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('Patient Information', margin, yPos);
  yPos += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const patientData = visit.patient_data || {};
  if (patient) {
    doc.text(`Name: ${patient.full_name}`, margin, yPos);
    yPos += 6;
    if (patient.date_of_birth) {
      const age = Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / 31557600000);
      doc.text(`Age: ${age} years`, margin, yPos);
      yPos += 6;
    }
    if (patient.gender) {
      doc.text(`Gender: ${patient.gender}`, margin, yPos);
      yPos += 6;
    }
    if (patient.phone_number) {
      doc.text(`Phone: ${patient.phone_number}`, margin, yPos);
      yPos += 6;
    }
    if (patient.cnic) {
      doc.text(`CNIC: ${patient.cnic}`, margin, yPos);
      yPos += 6;
    }
  } else if (patientData.name) {
    doc.text(`Name: ${patientData.name}`, margin, yPos);
    yPos += 6;
    if (patientData.age) {
      doc.text(`Age: ${patientData.age} years`, margin, yPos);
      yPos += 6;
    }
    if (patientData.gender) {
      doc.text(`Gender: ${patientData.gender}`, margin, yPos);
      yPos += 6;
    }
  }

  yPos += 5;
  doc.setDrawColor(200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Visit Details', margin, yPos);
  yPos += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${new Date(visit.created_at).toLocaleString()}`, margin, yPos);
  yPos += 6;
  if (visit.visit_type) {
    doc.text(`Visit Type: ${visit.visit_type}`, margin, yPos);
    yPos += 6;
  }
  if (visit.doctor_name) {
    doc.text(`Doctor: ${visit.doctor_name}`, margin, yPos);
    yPos += 6;
  }

  if (visit.vitals_data && Object.keys(visit.vitals_data).length > 0) {
    yPos += 5;
    doc.setDrawColor(200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 100, 200);
    doc.text('Vital Signs', margin, yPos);
    yPos += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);

    const vitals = visit.vitals_data as any;
    if (vitals.bloodPressureSystolic && vitals.bloodPressureDiastolic) {
      doc.text(`Blood Pressure: ${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic} mmHg`, margin, yPos);
      yPos += 6;
    }
    if (vitals.temperature) {
      doc.text(`Temperature: ${vitals.temperature}°${vitals.temperatureUnit || 'F'}`, margin, yPos);
      yPos += 6;
    }
    if (vitals.pulseRate) {
      doc.text(`Pulse Rate: ${vitals.pulseRate} bpm`, margin, yPos);
      yPos += 6;
    }
    if (vitals.respiratoryRate) {
      doc.text(`Respiratory Rate: ${vitals.respiratoryRate} breaths/min`, margin, yPos);
      yPos += 6;
    }
    if (vitals.oxygenSaturation) {
      doc.text(`Oxygen Saturation: ${vitals.oxygenSaturation}%`, margin, yPos);
      yPos += 6;
    }
    if (vitals.weight) {
      doc.text(`Weight: ${vitals.weight} kg`, margin, yPos);
      yPos += 6;
    }
    if (vitals.height) {
      doc.text(`Height: ${vitals.height} cm`, margin, yPos);
      yPos += 6;
    }
  }

  const symptomsData = visit.symptoms_data || [];
  if (Array.isArray(symptomsData) && symptomsData.length > 0) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    yPos += 5;
    doc.setDrawColor(200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(200, 0, 0);
    doc.text('Symptoms', margin, yPos);
    yPos += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);

    symptomsData.forEach((symptom: any, index: number) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${symptom.name}`, margin, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');

      if (symptom.duration) {
        doc.text(`   Duration: ${symptom.duration}`, margin, yPos);
        yPos += 6;
      }
      if (symptom.severity) {
        doc.text(`   Severity: ${symptom.severity}`, margin, yPos);
        yPos += 6;
      }
      yPos += 2;
    });
  }

  const testsData = visit.tests_data || [];
  if (Array.isArray(testsData) && testsData.length > 0) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    yPos += 5;
    doc.setDrawColor(200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 150, 0);
    doc.text('Tests & Investigations', margin, yPos);
    yPos += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);

    testsData.forEach((test: any, index: number) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${test.testName}`, margin, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');

      if (test.result) {
        doc.text(`   Result: ${test.result}`, margin, yPos);
        yPos += 6;
      }
      if (test.notes) {
        const notesLines = doc.splitTextToSize(`   Notes: ${test.notes}`, pageWidth - margin * 2);
        doc.text(notesLines, margin, yPos);
        yPos += notesLines.length * 6;
      }
      yPos += 2;
    });
  }

  const medicinesData = visit.medicines_data || [];
  if (Array.isArray(medicinesData) && medicinesData.length > 0) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    yPos += 5;
    doc.setDrawColor(200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(150, 0, 150);
    doc.text('Prescribed Medicines', margin, yPos);
    yPos += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);

    medicinesData.forEach((medicine: any, index: number) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${medicine.name}`, margin, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');

      if (medicine.dosage) {
        doc.text(`   Dosage: ${medicine.dosage}`, margin, yPos);
        yPos += 6;
      }
      if (medicine.frequency) {
        doc.text(`   Frequency: ${medicine.frequency}`, margin, yPos);
        yPos += 6;
      }
      if (medicine.duration) {
        doc.text(`   Duration: ${medicine.duration}`, margin, yPos);
        yPos += 6;
      }
      yPos += 2;
    });
  }

  if (visit.diagnosis_summary) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    yPos += 5;
    doc.setDrawColor(200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Diagnosis', margin, yPos);
    yPos += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const diagnosisLines = doc.splitTextToSize(visit.diagnosis_summary, pageWidth - margin * 2);
    doc.text(diagnosisLines, margin, yPos);
    yPos += diagnosisLines.length * 6;
  }

  if (visit.transcript) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    yPos += 5;
    doc.setDrawColor(200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Additional Notes', margin, yPos);
    yPos += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const transcriptLines = doc.splitTextToSize(visit.transcript, pageWidth - margin * 2);

    transcriptLines.forEach((line: string) => {
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, margin, yPos);
      yPos += 6;
    });
  }

  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  const fileName = `Visit_Report_${patient?.full_name || 'Patient'}_${new Date(visit.created_at).toLocaleDateString().replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
};
