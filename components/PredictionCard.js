import React from 'react';

const PredictionCard = ({ result }) => {
  // If there's no result data, the component renders nothing.
  if (!result) {
    return null;
  }

  // This helper function determines the color of the risk score text.
  const getRiskColor = (score) => {
    if (score > 0.70) return 'text-red-600'; // High risk
    if (score > 0.45) return 'text-yellow-500'; // Medium risk
    return 'text-green-600'; // Low risk
  };

  return (
    <div className="mt-8 p-6 bg-white rounded-2xl shadow-lg w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Prediction Result</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">

        {/* Card for displaying the numeric risk score and outcome */}
        <div className="p-6 bg-gray-50 rounded-xl">
          <h3 className="text-md font-semibold text-gray-500 uppercase tracking-wider">Risk Score</h3>
          <p className={`text-6xl font-bold my-2 ${getRiskColor(result.risk_score)}`}>
            {(result.risk_score * 100).toFixed(1)}%
          </p>
          <p className={`text-2xl font-semibold ${getRiskColor(result.risk_score)}`}>
            {result.outcome}
          </p>
        </div>

        {/* Card for displaying the recommended follow-up action */}
        <div className="p-6 bg-indigo-50 rounded-xl flex flex-col justify-center">
          <h3 className="text-md font-semibold text-gray-500 uppercase tracking-wider">Recommendation</h3>
          <p className="text-xl font-semibold text-indigo-800 mt-3">{result.follow_up}</p>
        </div>
      </div>

      {/* This section displays the message about the email alert status */}
      {result.message && (
        <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-800 rounded-r-lg">
          <p className="font-semibold">System Message:</p>
          <p>{result.message}</p>
        </div>
      )}
    </div>
  );
};

export default PredictionCard;