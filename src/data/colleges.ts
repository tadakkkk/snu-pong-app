export interface Track {
  id: string;
  name: string | null;
  tuition_2025_1: number;
  departments?: string;
}

export interface College {
  id: string;
  name: string;
  tracks: Track[];
}

export const colleges: College[] = [
  {
    id: "humanities",
    name: "인문대학",
    tracks: [{ id: "default", name: null, tuition_2025_1: 2442000 }],
  },
  {
    id: "social",
    name: "사회과학대학",
    tracks: [
      {
        id: "humanities_track",
        name: "인문사회계",
        tuition_2025_1: 2442000,
        departments: "정치외교, 경제, 사회, 사회복지, 언론정보",
      },
      {
        id: "lab_track",
        name: "심리·지리·인류학과",
        tuition_2025_1: 2679000,
        departments: "심리, 지리, 인류",
      },
    ],
  },
  {
    id: "natural",
    name: "자연과학대학",
    tracks: [
      { id: "natural", name: "자연계", tuition_2025_1: 2975000 },
      { id: "math", name: "수리과학부", tuition_2025_1: 2450000 },
    ],
  },
  {
    id: "nursing",
    name: "간호대학",
    tracks: [{ id: "default", name: null, tuition_2025_1: 2975000 }],
  },
  {
    id: "business",
    name: "경영대학",
    tracks: [{ id: "default", name: null, tuition_2025_1: 2442000 }],
  },
  {
    id: "engineering",
    name: "공과대학",
    tracks: [{ id: "default", name: null, tuition_2025_1: 2998000 }],
  },
  {
    id: "agriculture",
    name: "농업생명과학대학",
    tracks: [
      {
        id: "humanities_track",
        name: "인문사회계",
        tuition_2025_1: 2442000,
      },
      {
        id: "natural_track",
        name: "자연·교육계",
        tuition_2025_1: 2975000,
      },
    ],
  },
  {
    id: "fine_arts",
    name: "미술대학",
    tracks: [{ id: "default", name: null, tuition_2025_1: 3653000 }],
  },
  {
    id: "education",
    name: "사범대학",
    tracks: [
      {
        id: "humanities_track",
        name: "인문사회계",
        tuition_2025_1: 2442000,
      },
      {
        id: "science_pe",
        name: "과학·체육교육",
        tuition_2025_1: 2975000,
      },
      { id: "math_edu", name: "수학교육", tuition_2025_1: 2450000 },
      {
        id: "geo_edu",
        name: "지리교육 (2학년+)",
        tuition_2025_1: 2679000,
      },
    ],
  },
  {
    id: "human_ecology",
    name: "생활과학대학",
    tracks: [
      {
        id: "humanities_track",
        name: "인문사회계",
        tuition_2025_1: 2442000,
      },
      { id: "natural_track", name: "자연계", tuition_2025_1: 2975000 },
    ],
  },
  {
    id: "vet",
    name: "수의과대학",
    tracks: [
      { id: "pre_vet", name: "수의예과", tuition_2025_1: 3072000 },
      { id: "vet", name: "본과", tuition_2025_1: 4645000 },
    ],
  },
  {
    id: "pharmacy",
    name: "약학대학",
    tracks: [
      { id: "default", name: "통합6년제", tuition_2025_1: 4481000 },
    ],
  },
  {
    id: "music",
    name: "음악대학",
    tracks: [{ id: "default", name: null, tuition_2025_1: 3916000 }],
  },
  {
    id: "medicine",
    name: "의과대학",
    tracks: [
      { id: "pre_med", name: "의예과", tuition_2025_1: 3072000 },
      { id: "med", name: "본과", tuition_2025_1: 5038000 },
    ],
  },
  {
    id: "liberal_studies",
    name: "자유전공학부",
    tracks: [{ id: "default", name: null, tuition_2025_1: 2975000 }],
  },
  {
    id: "advanced_convergence",
    name: "첨단융합학부",
    tracks: [{ id: "default", name: null, tuition_2025_1: 3700000 }],
  },
];

export function getCollege(id: string): College | undefined {
  return colleges.find((c) => c.id === id);
}

export function getTuition(
  collegeId: string,
  trackId: string
): number | undefined {
  const college = getCollege(collegeId);
  const track = college?.tracks.find((t) => t.id === trackId);
  return track?.tuition_2025_1;
}

export function hasSingleTrack(college: College): boolean {
  return (
    college.tracks.length === 1 ||
    (college.tracks.length === 1 && college.tracks[0].name === null)
  );
}
