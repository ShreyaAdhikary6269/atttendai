import { RISK_LABEL } from '../utils/attendance';

export default function RiskBadge({ risk }) {
  return <span className={'badge ' + risk}>{RISK_LABEL[risk]}</span>;
}
