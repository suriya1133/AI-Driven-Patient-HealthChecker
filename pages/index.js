'use client';

import { useState, Fragment } from 'react';
import Head from 'next/head';

// --- Reusable Result Card Component (No changes needed) ---
const PredictionResultCard = ({ result }) => {
    if (!result) return null;
    const getRiskColor = (score) => {
        if (score > 0.8) return 'text-red-700';
        if (score > 0.5) return 'text-yellow-500';
        return 'text-green-600';
    };
    return (
        <div className="mt-8 p-6 bg-white rounded-2xl shadow-lg w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Prediction Result</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
                <div className="p-6 bg-gray-50 rounded-xl">
                    <h3 className="text-md font-semibold text-gray-500 uppercase">Risk Score</h3>
                    <p className={`text-6xl font-bold my-2 ${getRiskColor(result.risk_score)}`}>
                        {(result.risk_score * 100).toFixed(1)}%
                    </p>
                    <p className={`text-2xl font-semibold ${getRiskColor(result.risk_score)}`}>
                        {result.outcome}
                    </p>
                </div>
                <div className="p-6 bg-indigo-50 rounded-xl flex flex-col justify-center">
                    <h3 className="text-md font-semibold text-gray-500 uppercase">Recommendation</h3>
                    <p className="text-xl font-semibold text-indigo-800 mt-3">{result.follow_up}</p>
                </div>
            </div>
            {result.message && (
                <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-800 rounded-r-lg">
                    <p className="font-semibold">System Message:</p>
                    <p>{result.message}</p>
                </div>
            )}
        </div>
    );
};

// --- Form for Manual Data Entry ---
const ManualInputForm = ({ handleResult, setError }) => {
    // This component's logic is now correct and complete
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        age: 52, sex: 'male', cp: 'asymptomatic', trestbps: 125, chol: 212, fbs: true,
        restecg: 'normal', thalach: 168, exang: false, oldpeak: 1.0, slope: 'upsloping',
        ca: 2, thal: 'reversable defect', patient_name: 'John Doe',
        symptom_chest_pain: 0, symptom_shortness_of_breath: 0, symptom_dizziness: 0, symptom_fatigue: 0
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const finalValue = type === 'checkbox' ? (checked ? 1 : 0) : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        handleResult(null);

        const dataToSend = { ...formData,
            age: Number(formData.age), trestbps: Number(formData.trestbps), chol: Number(formData.chol),
            thalach: Number(formData.thalch), oldpeak: Number(formData.oldpeak), ca: Number(formData.ca),
            fbs: Boolean(formData.fbs), exang: Boolean(formData.exang)
        };

        try {
            const res = await fetch('http://127.0.0.1:8000/predict-from-form', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataToSend)
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || `Server error: ${res.status}`);
            }
            const data = await res.json();
            handleResult(data);
        } catch (err) {
            setError(err.message || 'Prediction failed.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">Patient Vitals & Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                <input name="patient_name" value={formData.patient_name} onChange={handleChange} placeholder="Patient Name" className="p-3 border rounded-lg text-gray-900" />
                <input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="Age" className="p-3 border rounded-lg text-gray-900" />
                <select name="sex" value={formData.sex} onChange={handleChange} className="p-3 border rounded-lg bg-white text-gray-900"><option value="male">Male</option><option value="female">Female</option></select>
                <input type="number" name="trestbps" value={formData.trestbps} onChange={handleChange} placeholder="Resting Blood Pressure" className="p-3 border rounded-lg text-gray-900" />
                <input type="number" name="chol" value={formData.chol} onChange={handleChange} placeholder="Cholesterol" className="p-3 border rounded-lg text-gray-900" />
                <input type="number" name="thalch" value={formData.thalch} onChange={handleChange} placeholder="Max Heart Rate" className="p-3 border rounded-lg text-gray-900" />
                <select name="cp" value={formData.cp} onChange={handleChange} className="p-3 border rounded-lg bg-white text-gray-900"><option value="typical angina">Typical Angina</option><option value="atypical angina">Atypical Angina</option><option value="non-anginal">Non-Anginal</option><option value="asymptomatic">Asymptomatic</option></select>
                <select name="slope" value={formData.slope} onChange={handleChange} className="p-3 border rounded-lg bg-white text-gray-900"><option value="upsloping">Upsloping</option><option value="flat">Flat</option><option value="downsloping">Downsloping</option></select>
                <input type="number" step="0.1" name="oldpeak" value={formData.oldpeak} onChange={handleChange} placeholder="Oldpeak" className="p-3 border rounded-lg text-gray-900" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 pt-4">Symptoms Checklist</h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg"><input id="symptom_chest_pain" name="symptom_chest_pain" type="checkbox" checked={!!formData.symptom_chest_pain} onChange={handleChange} className="h-5 w-5 rounded accent-indigo-600" /><label htmlFor="symptom_chest_pain" className="font-medium text-gray-700">Chest Pain</label></div>
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg"><input id="symptom_shortness_of_breath" name="symptom_shortness_of_breath" type="checkbox" checked={!!formData.symptom_shortness_of_breath} onChange={handleChange} className="h-5 w-5 rounded accent-indigo-600" /><label htmlFor="symptom_shortness_of_breath" className="font-medium text-gray-700">Shortness of Breath</label></div>
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg"><input id="symptom_dizziness" name="symptom_dizziness" type="checkbox" checked={!!formData.symptom_dizziness} onChange={handleChange} className="h-5 w-5 rounded accent-indigo-600" /><label htmlFor="symptom_dizziness" className="font-medium text-gray-700">Dizziness</label></div>
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg"><input id="symptom_fatigue" name="symptom_fatigue" type="checkbox" checked={!!formData.symptom_fatigue} onChange={handleChange} className="h-5 w-5 rounded accent-indigo-600" /><label htmlFor="symptom_fatigue" className="font-medium text-gray-700">Fatigue</label></div>
            </div>
            <div className="pt-6">
                <button type="submit" disabled={isLoading} className="w-full text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 font-bold rounded-lg text-lg px-5 py-4 text-center">
                    {isLoading ? 'Analyzing...' : 'Predict From Form'}
                </button>
            </div>
        </form>
    );
};

// --- Form for Symptom-Based Prediction (with new direct percentage display) ---
const SymptomCheckerForm = ({ handleResult, setError }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [symptoms, setSymptoms] =useState({
        symptom_chest_pain: false,
        symptom_shortness_of_breath: false,
        symptom_dizziness: false,
        symptom_fatigue: false,
    });
    const [symptomResult, setSymptomResult] = useState(null);

    const handleSymptomChange = (e) => {
        const { name, checked } = e.target;
        setSymptoms(prev => ({...prev, [name]: checked}));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        handleResult(null); // Clear the main result card
        setSymptomResult(null); // Clear the local percentage display

        try {
            const res = await fetch('http://127.0.0.1:8000/predict-from-symptoms', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(symptoms)
            });
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const data = await res.json();
            setSymptomResult(data); // Set the local result for direct display
            handleResult(data); // Also pass to parent to trigger modal if needed
        } catch (err) {
            setError(err.message || 'Prediction failed.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit}>
            <h3 className="text-lg font-semibold text-gray-800">Select Patient's Symptoms</h3>
            <div className="mt-4 grid grid-cols-2 gap-4">
                {Object.keys(symptoms).map(key => (
                    <div key={key} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                        <input id={key} name={key} type="checkbox" checked={symptoms[key]} onChange={handleSymptomChange} className="h-5 w-5 rounded accent-indigo-600" />
                        <label htmlFor={key} className="font-medium text-gray-700 capitalize">{key.replace('symptom_', '').replace(/_/g, ' ')}</label>
                    </div>
                ))}
            </div>
            <div className="pt-6">
                <button type="submit" disabled={isLoading} className="w-full text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 font-bold rounded-lg text-lg px-5 py-4 text-center">
                    {isLoading ? 'Analyzing Symptoms...' : 'Predict From Symptoms'}
                </button>
            </div>
            {symptomResult && (
                <div className="mt-6 text-center p-4 bg-gray-100 rounded-lg">
                    <h4 className="font-semibold text-gray-700">Symptom-Based Risk Estimate:</h4>
                    <p className={`text-4xl font-bold mt-2 ${symptomResult.risk_score > 0.8 ? 'text-red-700' : 'text-yellow-500'}`}>
                        {(symptomResult.risk_score * 100).toFixed(1)}%
                    </p>
                </div>
            )}
        </form>
    );
};

// --- Form for Report Upload ---
const ReportUploadForm = ({ handleResult, setError }) => {
  const [reportFile, setReportFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setReportFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!reportFile) {
      setError('Please select a report file.');
      return;
    }
    setIsLoading(true);
    setError('');
    handleResult(null);

    const formData = new FormData();
    formData.append('report_file', reportFile);

    try {
      const res = await fetch('http://127.0.0.1:8000/predict-with-report', {
        method: 'POST', body: formData,
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || `Server error: ${res.status}`);
      }
      const data = await res.json();
      handleResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpload} className="space-y-6">
      <div>
        <label htmlFor="reportFile" className="block text-sm font-medium text-gray-700">Patient Report (CSV or PDF)</label>
        {/* THE ONLY CHANGE IS HERE in the 'accept' attribute */}
        <input type="file" id="reportFile" onChange={handleFileChange} accept=".csv,.pdf" required className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
      </div>
      <div className="pt-4">
        <button type="submit" disabled={isLoading} className="w-full text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 font-bold rounded-lg text-lg px-5 py-4 text-center">
          {isLoading ? 'Analyzing Report...' : 'Upload and Predict'}
        </button>
      </div>
    </form>
  );
};


// --- The Critical Alert Modal Component ---
const CriticalAlertModal = ({ alertData, setAlertData }) => {
    if (!alertData) return null;

    const [clinicianEmail, setClinicianEmail] = useState('supervisor@hospital.com');
    const [isSending, setIsSending] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSending(true);
        setMessage('');

        try {
            const res = await fetch('http://127.0.0.1:8000/send-alert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prediction_id: alertData.prediction_id,
                    clinician_email: clinicianEmail
                })
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || 'Failed to send alert.');
            }
            const data = await res.json();
            setMessage(data.message);
            setTimeout(() => setAlertData(null), 3000); // Close modal on success
        } catch (err) {
            setMessage(err.message);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md m-4">
                <div className="text-center">
                    <span className="text-6xl">⚠️</span>
                    <h2 className="text-2xl font-bold text-red-700 mt-4">Critical Risk Detected!</h2>
                    <p className="text-gray-600 mt-2">
                        The risk score for patient <span className="font-bold">{alertData.patient_name || 'N/A'}</span> is <span className="font-bold">{(alertData.risk_score * 100).toFixed(1)}%</span>.
                        Please notify the responsible clinician immediately.
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                        <label htmlFor="clinicianEmail" className="block text-sm font-medium text-gray-700">Responsible Clinician's Email</label>
                        <input type="email" id="clinicianEmail" value={clinicianEmail} onChange={(e) => setClinicianEmail(e.target.value)} required className="mt-1 block w-full p-3 border rounded-lg text-gray-900" />
                    </div>
                    <div className="pt-4 flex flex-col items-center gap-4">
                        <button type="submit" disabled={isSending} className="w-full text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 font-bold rounded-lg text-lg px-5 py-3 text-center">
                            {isSending ? 'Sending...' : 'Send Emergency Alert'}
                        </button>
                        <button type="button" onClick={() => setAlertData(null)} className="text-sm text-gray-600 hover:underline">
                            Cancel
                        </button>
                    </div>
                    {message && <p className={`text-center font-semibold mt-4 ${message.includes('success') ? 'text-green-700' : 'text-red-700'}`}>{message}</p>}
                </form>
            </div>
        </div>
    );
};


// --- Main Page Component ---
export default function Home() {
    const [activeTab, setActiveTab] = useState('manual');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [criticalAlert, setCriticalAlert] = useState(null);

    const handleResult = (data) => {
        setResult(data);
        if (data && data.risk_score > 0.80) {
            // A prediction ID is needed for the alert email to work
            if(data.prediction_id) {
                setCriticalAlert(data);
            } else {
                console.warn("High risk detected, but no prediction_id was provided to trigger the alert modal.");
            }
        }
    };
    
    const renderForm = () => {
        if (activeTab === 'symptoms') return <SymptomCheckerForm handleResult={handleResult} setError={setError} />;
        if (activeTab === 'upload') return <ReportUploadForm handleResult={handleResult} setError={setError} />;
        return <ManualInputForm handleResult={handleResult} setError={setError} />;
    };

    return (
        <Fragment>
            <CriticalAlertModal alertData={criticalAlert} setAlertData={setCriticalAlert} />
            <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
                <Head><title>AI Patient Risk Predictor</title></Head>
                <main className="w-full max-w-4xl">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-900">AI Patient Follow-Up System</h1>
                    </div>
                    <div className="mt-10 flex justify-center border-b border-gray-200">
                        <button onClick={() => { setActiveTab('manual'); setResult(null); setError(''); }} className={`px-6 py-3 font-semibold ${activeTab === 'manual' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}>Manual Input</button>
                        <button onClick={() => { setActiveTab('symptoms'); setResult(null); setError(''); }} className={`px-6 py-3 font-semibold ${activeTab === 'symptoms' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}>Symptom Checker</button>
                        <button onClick={() => { setActiveTab('upload'); setResult(null); setError(''); }} className={`px-6 py-3 font-semibold ${activeTab === 'upload' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}>Upload Report</button>
                    </div>
                    <div className="mt-8 p-8 bg-white rounded-2xl shadow-lg">{renderForm()}</div>
                    {error && <p className="text-red-600 bg-red-100 p-4 text-center mt-6 font-semibold rounded-lg">{error}</p>}
                    {/* The main result card is hidden when showing only the symptom percentage */}
                    {result && activeTab !== 'symptoms' && <PredictionResultCard result={result} />}
                </main>
            </div>
        </Fragment>
    );
}