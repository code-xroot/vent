// src/lib/types/report.ts
import { ObjectId } from 'mongodb';

export type ReportItemType = 'vent' | 'comment';
export type ReportStatus = 'pending' | 'reviewed_action_taken' | 'reviewed_dismissed';

export interface Report {
  _id?: ObjectId;
  reportedItemId: ObjectId; // ID of the Vent or Comment
  itemType: ReportItemType;
  reason: string; // Could be a predefined key or free text
  reporterUserId: string; // ID of the user who submitted the report (from session)
  status: ReportStatus;
  createdAt: Date;
  notes?: string; // Optional notes by moderator
}
