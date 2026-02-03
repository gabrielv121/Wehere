/** Browse categories for the home page – 4 per slide, with matching images */

export interface BrowseCategory {
  id: string;
  name: string;
  image: string;
  /** Link to events list (category filter + optional search) */
  to: string;
}

const UNSPLASH = (id: string, w = 400) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=80`;

export const BROWSE_CATEGORIES: BrowseCategory[] = [
  { id: 'nfl', name: 'NFL', image: UNSPLASH('1560272564-c83b66b1ad12'), to: '/events?category=sports&q=NFL' },
  { id: 'concert', name: 'Concert', image: UNSPLASH('1470229722913-7c0e2dbbafd3'), to: '/events?category=concert' },
  { id: 'nba', name: 'NBA', image: UNSPLASH('1546519638-68e109498ffc'), to: '/events?category=sports&q=NBA' },
  { id: 'ncaa-football', name: "NCAA Football", image: UNSPLASH('1504450758481-7338bbe75d4'), to: '/events?category=sports&q=NCAA' },
  { id: 'nhl', name: 'NHL', image: UNSPLASH('1515703403482-8ea8d8a8b8'), to: '/events?category=sports&q=NHL' },
  { id: 'mlb', name: 'MLB', image: UNSPLASH('1529963183134-61a90b47e2de'), to: '/events?category=sports&q=MLB' },
  { id: 'mls', name: 'MLS', image: UNSPLASH('1574629810360-7efbfe15be0'), to: '/events?category=sports&q=soccer' },
  { id: 'wnba', name: 'WNBA', image: UNSPLASH('1519861155730-84b389a61f'), to: '/events?category=sports&q=WNBA' },
  { id: 'ncaa-basketball', name: "NCAA Men's Basketball", image: UNSPLASH('1519861155730-84b389a61f'), to: '/events?category=sports&q=NCAA+basketball' },
  { id: 'broadway', name: "Broadway Shows", image: UNSPLASH('1503095396549-807759245b35'), to: '/events?category=theater' },
  { id: 'comedy', name: 'Comedy', image: UNSPLASH('1585699324551-fbdc0db4bc8e'), to: '/events?category=comedy' },
  { id: 'wwe', name: 'WWE', image: UNSPLASH('1571019614242-c5c5dee9f50b'), to: '/events?category=sports&q=WWE' },
  { id: 'tennis', name: 'Tennis', image: UNSPLASH('1554068865-24cecd4e34b8'), to: '/events?category=sports&q=tennis' },
  { id: 'golf', name: 'Golf', image: UNSPLASH('1535131749006-b7f58c99034b'), to: '/events?category=sports&q=golf' },
];
