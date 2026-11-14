import { CHANGELOG_DATA } from './changeLog';

const latestChangelog = CHANGELOG_DATA?.reduce((latest, current) => 
  current.id > latest.id ? current : latest, CHANGELOG_DATA?.[0]
);
export const latestVersion = latestChangelog?.title || "V-1.0.0";
export const copyRight = `© ${new Date().getFullYear()} pChats. All rights reserved.`;