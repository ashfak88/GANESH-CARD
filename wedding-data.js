// ─────────────────────────────────────────────────────────────
//  Edit everything about the invitation here. No other file
//  needs to change for names, dates, venue, schedule or RSVP.
// ─────────────────────────────────────────────────────────────
window.WEDDING_DATA = {
  couple: {
    first: "Rohan",
    second: "Meera",
    heroNote: "Together with our families",
    subtitle: "Our favourite chapter begins."
  },

  wedding: {
    dateLabel: "14 · 03 · 2027",
    longDate: "Sunday, 14 March 2027",
    // Local start / end time of the ceremony (ISO 8601 with UTC offset).
    dateISO: "2027-03-14T17:00:00+05:30",
    endISO: "2027-03-14T23:00:00+05:30",
    salutation: "Dear friends and family,",
    invitationNote:
      "With full hearts, we invite you to share in our wedding day. Come for the vows, stay for the laughter, and help us make memories to keep forever.",
    scheduleNote: "All times are local to the venue."
  },

  schedule: [
    { time: "5 PM", title: "Guest arrival" },
    { time: "6 PM", title: "Wedding ceremony" },
    { time: "7 PM", title: "Mocktail hour" },
    { time: "8 PM", title: "Dinner" },
    { time: "9 PM", title: "Celebration" }
  ],

  venue: {
    name: "Magnolia Lakeside Pavilion",
    address: "12 Rosewater Lane, Lakeview, Kochi, Kerala 682001",
    // Leave empty to search Google Maps by name + address, or paste a share link.
    mapsUrl: "",
    timeLabel: "Sunday, 14 March · 5 PM",
    sceneCaption: "A little glimpse of our celebration’s spirit",
    note: "A fictional venue for this sample invitation."
  },

  details: {
    dressCode: "Formal attire. Kindly avoid deep red and maroon, reserved for the celebration.",
    giftPreference: "Your presence is our greatest gift. Kindly, no boxed gifts."
  },

  rsvp: {
    // Replies open the guest's email app addressed to this address.
    // Replace with the host's real address; leave empty to disable sending.
    email: "rsvp@example.com",
    heading: "A place in our hearts",
    note: "Your presence would make our day even more special. Please let us know if you can join us.",
    deadline: ""            // e.g. "20 February 2027"
  },

  // Optional media. Leave a path empty ("") to skip it.
  //  • music: your own audio file. If empty, a soft built-in music-box melody plays instead.
  //  • openingVideo / heroVideo: short vertical (9:16) clips that replace the built-in animation / still.
  media: {
    openingVideo: "",       // e.g. "./media/opening.mp4"
    openingPoster: "",
    heroVideo: "",          // e.g. "./media/hero.mp4"
    heroPoster: "",
    music: "",              // e.g. "./media/music.mp3"
    musicTitle: "",
    musicSource: ""
  }
};
