'use client';

import React from 'react';
import SurveyForm from '../../components/SurveyForm';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function SurveyPage() {
  return (
    <ProtectedRoute>
      <SurveyForm />
    </ProtectedRoute>
  );
}