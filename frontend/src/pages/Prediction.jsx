import { useCallback, useEffect, useMemo, useState } from 'react';
import { GitCompare, CheckCircle2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import { api } from '../api/client';
import { trainingReadiness } from '../utils/mlData';
import ReadinessCard from '../components/ReadinessCard';
import ModelCard from '../components/ModelCard';
import PredictionResults from '../components/PredictionResults';

export default function Prediction() {
  const { students, attendance } = useData();
  const readiness = useMemo(() => trainingReadiness(students, attendance), [students, attendance]);

  const [service, setService] = useState('checking');
  const [model, setModel] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [result, setResult] = useState(null);
  const [notice, setNotice] = useState('');

  const loadStatus = useCallback(async () => {
    setService('checking');
    setError('');
    try {
      const s = await api('/api/predictions/status');
      setModel(s);
      setService('online');
    } catch (e) {
      setModel(null);
      setService('offline');
      setError(e.message);
    }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  async function train() {
    setBusy('train'); setNotice(''); setError('');
    try {
      const s = await api('/api/predictions/train', { method: 'POST', timeout: 120000 });
      setModel(s);
      setResult(null);
      setNotice(s.status === 'TRAINED' ? 'Model trained and tested.' : 'Training stopped: not enough data.');
    } catch (e) {
      setError(e.message);
      setNotice('');
    } finally {
      setBusy('');
    }
  }

  async function predict() {
    setBusy('predict'); setNotice(''); setError('');
    try {
      const r = await api('/api/predictions/run', { method: 'POST', timeout: 60000 });
      setResult(r);
      setNotice('Predictions generated.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }

  const canPredict = service === 'online' && model && model.status === 'TRAINED';

  return (
    <>
      <h1 className="page-title">AI Risk Prediction</h1>
      <p className="page-sub">
        A Decision Tree (scikit-learn) learns from attendance history to flag students who may fall below 75%.
        Nothing is predicted until the model has been trained and tested.
      </p>

      {notice && <div className="notice good" style={{ marginBottom: 16 }}><CheckCircle2 size={18} /><span>{notice}</span></div>}
      {service === 'online' && error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="grid-row r-pred">
        <ModelCard
          service={service} error={error} model={model} busy={busy} canPredict={canPredict}
          onRefresh={loadStatus} onTrain={train} onPredict={predict}
        />
        <ReadinessCard readiness={readiness} />
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 className="card-title"><GitCompare size={18} /> Rule-based alerts vs ML predictions</h3>
        <div className="compare-grid">
          <div>
            <b>Rule-based alert</b>
            <p className="muted">
              Looks only at the current percentage. Below 75% is High Risk, 75% to 84% is Monitor.
              It tells you who is already in trouble. Used on the Dashboard, Students and Reports pages.
            </p>
          </div>
          <div>
            <b>ML prediction</b>
            <p className="muted">
              Learns patterns from past months, such as level, trend and weak subjects, to estimate who is heading
              toward risk. It can disagree with the rule, and it can be wrong. Shown only on this page.
            </p>
          </div>
        </div>
      </div>

      {result && <PredictionResults result={result} students={students} attendance={attendance} />}
    </>
  );
}
