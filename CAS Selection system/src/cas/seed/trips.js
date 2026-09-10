/**
 * The nine excursions, transcribed from "Handbook CAS excursion week.pdf".
 *
 * IMPORTANT — read before publishing to students
 * ----------------------------------------------
 * Nothing here is invented. Every figure, name and phrase comes from the
 * handbook. Where the handbook gives no description (Kayaking, Scuba Diving,
 * Sailing, Junior Chef, Artistic Retreat, Flora Field Work) the `description`
 * is a one-line restatement of the handbook row and nothing more — the trip
 * leaders should expand these in the Admin page before students choose.
 *
 * Two things to check with the CAS coordinator (also listed in the README):
 *   • The handbook labels the Barcelona bike tour "ACTION". Reproduced
 *     verbatim below; it is most likely meant to read "Activity".
 *   • The handbook gives no CAS strand for the Junior Chef program.
 *
 * Cost model
 * ----------
 *   cost      number | null   Lowest / headline figure, in OMR.
 *   costTo    number | null   Upper figure when the handbook gives a range.
 *   costNote  string          Free text shown under the figure, e.g.
 *                             "incl. flights" or "+ 350 OMR flights".
 *
 * Capacity model
 * --------------
 *   maxStudents  number   0 = no limit. This is the cap the join transaction
 *                         and the security rules enforce.
 *   minStudents  number   0 = none. Stored for the coordinator's reference —
 *                         it is NOT surfaced to students and does NOT block
 *                         anything. See README "Deliberately not built".
 */

export const HANDBOOK_TRIPS = [
  {
    id: 'kayaking',
    order: 1,
    name: 'Kayaking',
    leader: 'Mr Jim',
    cost: 220,
    costTo: null,
    costNote: '',
    minStudents: 15,
    maxStudents: 20,
    duration: '',
    strands: ['Activity'],
    description:
      'Kayaking excursion led by Mr Jim. Counts towards the Activity strand.',
  },
  {
    id: 'scuba-diving',
    order: 2,
    name: 'Scuba Diving',
    leader: 'Mr Essex',
    cost: 230,
    costTo: 290,
    costNote: '',
    minStudents: 8,
    maxStudents: 12,
    duration: '',
    strands: ['Activity'],
    description:
      'Scuba diving excursion led by Mr Essex. Counts towards the Activity strand.',
  },
  {
    id: 'sailing',
    order: 3,
    name: 'Sailing',
    leader: 'Mr Nik',
    cost: 120,
    costTo: null,
    costNote: '',
    minStudents: 10,
    maxStudents: 15,
    duration: '',
    strands: ['Activity'],
    description:
      'Sailing excursion led by Mr Nik. Counts towards the Activity strand.',
  },
  {
    id: 'junior-chef',
    order: 4,
    name: 'Junior Chef Program',
    leader: 'Mr Sebastien',
    cost: 115,
    costTo: null,
    costNote: '',
    minStudents: 12,
    maxStudents: 15,
    duration: '',
    strands: [],
    description: 'Junior Chef program led by Mr Sebastien.',
  },
  {
    id: 'spain',
    order: 5,
    name: 'Cultural Experience in Spain',
    leader: 'Mr Mario',
    cost: 850,
    costTo: null,
    costNote: 'incl. flights',
    minStudents: 0,
    maxStudents: 20,
    duration: '',
    strands: ['Creativity', 'Activity', 'Service'],
    description:
      'A cultural week across Barcelona and Madrid.\n' +
      '• Cooking workshop in Barcelona — Creativity\n' +
      '• Bike tour in Barcelona — Action\n' +
      '• Skiing in Madrid — Activity\n' +
      '• Community service in Madrid — students prepare lunch and go along ' +
      'Gran Via to feed homeless people on this street — Service',
  },
  {
    id: 'egypt',
    order: 6,
    name: 'Cultural Experience in Egypt',
    leader: 'Ms Nesrine',
    cost: 730,
    costTo: null,
    costNote: 'incl. flights · approx. $1,900',
    minStudents: 0,
    maxStudents: 15,
    duration: '6 days / 5 nights',
    strands: ['Activity'],
    description:
      'A cultural experience in Egypt led by Ms Nesrine, including kayaking. ' +
      'Six days and five nights. Counts towards the Activity strand.',
  },
  {
    id: 'bali',
    order: 7,
    name: 'Service Trip to Bali',
    leader: 'Ms Anne',
    cost: 423,
    costTo: null,
    costNote: '+ 350 OMR flights · approx. $1,100 excl. flights',
    minStudents: 10,
    maxStudents: 12,
    duration: '6 days / 5 nights',
    strands: ['Service', 'Activity'],
    description:
      'A service and activity project in Bali.\n' +
      'Service: support teachers at a Special Needs Centre (games, basic ' +
      'hygiene, student support) and take part in infrastructure work ' +
      '(biogas project, painting, building and similar).\n' +
      'Adventure and activities: cooking class, rice fields walk, ' +
      'snorkelling and the market.',
  },
  {
    id: 'artistic-retreat',
    order: 8,
    name: 'Artistic Retreat',
    leader: 'Ms Jelena',
    cost: 195,
    costTo: null,
    costNote: '',
    minStudents: 6,
    maxStudents: 10,
    duration: '',
    strands: ['Creativity'],
    description:
      'An artistic retreat led by Ms Jelena. A Creativity project.',
  },
  {
    id: 'flora-field-work',
    order: 9,
    name: 'Flora Field Work',
    leader: 'Ruaridh',
    cost: 60,
    costTo: null,
    costNote: '',
    minStudents: 5,
    maxStudents: 10,
    duration: '',
    strands: ['Creativity', 'Service'],
    description:
      'Flora field work led by Ruaridh. Counts towards the Creativity and ' +
      'Service strands.',
  },
]
