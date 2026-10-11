import { CertificateSlotStatus } from '../../domain/enums/certificate.enums';
import { CefrLevel } from '../../domain/enums/user.enums';

export interface Certificate {
  id: string;
  code: string;
  levelCode: CefrLevel;
  levelTitle: string;
  germanLevelName: string;
  recipientName: string;
  scorePercent: number;
  issuedAtUtc: string;
}

export interface CertificateSlot {
  levelCode: CefrLevel;
  levelTitle: string;
  status: CertificateSlotStatus;
  certificate: Certificate | null;
}

export interface VerifyCertificateResult {
  valid: boolean;
  code: string | null;
  recipientName: string | null;
  levelCode: CefrLevel | null;
  levelTitle: string | null;
  germanLevelName: string | null;
  scorePercent: number | null;
  issuedAtUtc: string | null;
}