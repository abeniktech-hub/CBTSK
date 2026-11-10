export type Sub = { n: string; title: string; body: string; refs?: string };
export type Article = {
  n: number;
  title: string;
  body?: string;
  refs?: string;
  subs?: Sub[];
};

export const affirmation: Article[] = [
  {
    n: 1,
    title: "The Scripture",
    body: "We believe that the Holy Bible was written by men divinely inspired, and is God's revelation of Himself to man. It is a perfect treasure of God's instruction. It has God for its author, salvation for its end, and truth for its matter. It reveals the principles by which God judges us, and is and will remain to the end of the world, the supreme standard by which all human conduct, creeds, and religious opinions should be tried. We believe that the Bible is the inerrant Word of God and is a testimony to Christ, who is the focus of divine revelation.",
    refs: "Exodus 24:4; Deuteronomy 4:1-2; 17:19; Joshua 8:34; Psalms 19:7-10; 119:11, 89,105,140; Isaiah 34:16; 40:8; Jeremiah 15:16; 36:1-32; Matthew 5:17-18; 22:29; Luke 21:33; 24:44-46; John 5:39; 16:13-15; 17:17; Acts 2:16ff.; 17:11; Romans 15:4; 16:25-26; 2 Timothy 3:15-17; Hebrews 1:1-2; 4:12; 1 Peter 1:25; 2 Peter 1:19-21.",
  },
  {
    n: 2,
    title: "God",
    body: "There is one and only one true and living God, who is an intelligent, spiritual, and personal Being, the Creator, Preserver, and Ruler of the Universe, and who is infinite in holiness and all other perfections. To Him we owe the highest love, reverence, and obedience. God is all-powerful and all-knowing. His perfect knowledge extends to all things, past, present, and future, including the future decisions of His free creatures. He is revealed to us as Father, Son and Holy Spirit, each with distinct personal attributes, but without division of nature, essence, or being.",
    subs: [
      {
        n: "2.1",
        title: "God the Father",
        body: "God as Father exercises providential care over all things: His universe, His creatures, and the flow of the stream of human history. He works out all things according the purposes of His grace. God is all-powerful, all-knowing, all-loving, and all wise. To those who become His children through faith in Jesus Christ, He is indeed their Father. In His attitude toward all men, God is fatherly.",
        refs: "Genesis 1:1; 2:7; Exodus 3:14; 6:2-3; 15:11ff.; 20:1ff.; Leviticus 22:2; Deuteronomy 6:4; 32:6; 1 Chronicles 29:10; Psalm 19:1-3; Isaiah 43:3,15; 64:8; Jeremiah 10:10; 17:13; Matthew 6:9ff.; 7:11; 23:9; 28:19; Mark 1:9-11; John 4:24; 5:26; 14:6-13; 17:1-8; Acts 1:7; Romans 8:14-15; 1 Corinthians 8:6; Galatians 4:6; Ephesians 4:6; Colossians 1:15; 1 Timothy 1:17; Hebrews 11:6; 12:9; 1 Peter 1:17; 1 John 5:7",
      },
      {
        n: "2.2",
        title: "God the Son",
        body: "Jesus Christ is the eternal Son of God. In His incarnation as Jesus Christ, He was conceived of the Holy Spirit and born of the virgin Mary. He revealed and did the will of God perfectly and took upon Himself human nature and identified Himself completely with man, but was without sin. He obeyed the Father perfectly and died as a substitute on the cross, thus making provision for the redemption of men from sin. He died, was buried, but was raised from the dead with a glorified body and appeared to His disciples as the person who was with them before his crucifixion. He ascended into heaven and is now exalted at the right hand of God, where He is the One Mediator, fully God, fully man; reconciliation between God and man is effected through His Person. He will come again in power and glory to judge the world and to consummate His redemptive mission. He dwells in all believers now as the living and ever-present Lord.",
        refs: "Genesis 18:1ff.; Psalms 2:7ff.; 110:1ff.; Isaiah 7:14; 53; Matthew 1:18-23; 3:17; 8:29; 11:27; 14:33; 16:16,27; 17:5; 27; 28:1-6,19; Mark 1:1; 3:11; Luke 1:35; 4:41; 22:70; 24:46; John 1:1-18,29; 10:30,38; 11:25-27; 12:44-50; 14:7-11; 16:15-16,28; 17:1-5, 21-22; 20:1-20,28; Acts 1:9; 2:22-24; 7:55-56; 9:4-5,20; Romans 1:3-4.",
      },
      {
        n: "2.3",
        title: "God the Holy Spirit",
        body: "The Holy Spirit is the Spirit of God and fully God. He is the one who inspired holy men of old to write the Scripture. Through His illumination He enables men to understand truth. He glorifies Christ. He convicts men of sin, of righteousness, and of judgment. He effects regeneration in men and brings them to the Savior. He baptizes every believer at the moment of regeneration into the Body of Christ. He cultivates Christian character, comforts believers, and gives spiritual gifts by which they serve God through His Church. He seals the believer for the day of final redemption. His presence in the Christian is the guarantee that God will bring the believer into the fullness of the stature of Christ. He enlightens and empowers the believer and the church in worship, evangelism, and service.",
        refs: "Genesis 1:2; Judges 14:6; Job 26:13; Psalms 51:11; 139:7ff.; Isaiah 61:1-3; Joel 2:28-32; Matthew 1:18; 3:16; 4:1; 12:28-32; 28:19; Mark 1:10,12; Luke 1:35; 4:1,18-19; 11:13; 12:12; 24:49; John 4:24; 14:16-17,26; 15:26; 16:7-14; Acts 1:8; 2:1-4,38; 4:31; 5:3; 6:3; 7:55; 8:17,39; 10:44; 13:2; 15:28; 16:6; 19:1-6; Romans 8:9-11,14-16.",
      },
    ],
  },
  {
    n: 3,
    title: "Man",
    body: "Man was created by the special act of God. He is in God's image. God created them male and female as the crowning work of His creation. The gift of gender (man as male and female) is part of the goodness of God's creation. Man was created without sin and was endowed with freedom of choice. Yet, man sinned against God and brought sin into the human race. Through Satan's temptation, man transgressed the command of God, and fell from his original innocence. Thus, his posterity inherits a nature and an environment inclined toward sin. Only the grace of God can bring man into His holy fellowship and enable man to fulfill the creative purpose of God. The sacredness of human personality is evident in that God created man in His own image, and in that Christ died for man; therefore, every person of every race possesses full dignity and is worthy of respect and Christian love.",
    refs: "Genesis 1:26-30; 2:5,7,18-22; 3; 9:6; Psalms 1; 8:3-6; 32:1-5; 51:5; Isaiah 6:5; Jeremiah 17:5; Matthew 16:26; Acts 17:26-31; Romans 1:19-32; 3:10-18,23; 5:6,12,19; 6:6; 7:14-25; 8:14-18, 29.",
  },
  {
    n: 4,
    title: "Salvation",
    body: "Salvation involves the redemption of the whole person, and is offered freely to all who put their trust in Jesus Christ as Lord and Savior, who through His own blood obtained eternal redemption for the believer. The process of salvation includes regeneration, justification, sanctification, and glorification. Without personal faith in Jesus Christ as Lord, there is no salvation.",
    subs: [
      {
        n: "4.1",
        title: "Regeneration",
        body: "This is the new birth of believers. It is a work of God's grace in which believers become new creations in Christ Jesus. It involves a change of heart wrought by the Holy Spirit through conviction of sin, to which the sinner responds in repentance toward God and faith in the Lord Jesus Christ. Repentance and faith are works of grace that cannot be separated. Repentance is a sincere turning from sin toward God. Faith is accepting Jesus Christ and committing the entire personality to Him as Lord and Savior.",
      },
      {
        n: "4.2",
        title: "Justification",
        body: "Justification is God's gracious and full acquittal upon principles of righteousness of all sinners who believe in Christ. This blessing is bestowed, not in consideration of any works of righteousness which we have done, but through redemption that is in and through Jesus Christ. It brings us into a state of peace and favor with God.",
      },
      {
        n: "4.3",
        title: "Sanctification",
        body: "This is the process by which the regenerate persons gradually attain to moral and spiritual perfection through the presence and power of the Holy Spirit dwelling in their hearts. Sanctification begins in regeneration where the believer is set apart to God's purposes and is enabled to progress toward moral and spiritual maturity through the presence and power of the Holy Spirit dwelling in him. It continues throughout the earthly life and is only completed at death.",
      },
      {
        n: "4.4",
        title: "Glorification",
        body: "Glorification is the culmination of salvation and is the final blessed and abiding state of the redeemed.",
      },
    ],
    refs: "Genesis 3:15; Exodus 3:14-17; 6:2-8; Matthew 1:21; 4:17; 16:21-26; 27:22-28:6; Luke 1:68-69; 2:28-32; John 1:11-14,29; 3:3-21,36; 5:24; 10:9,28-29; 15:1-16; 17:17; Acts 2:21; 4:12; 15:11; 16:30-31; 17:30-31; 20:32; Romans 1:16-18; 2:4; 3:23-25; 4:3ff.; 5:8-10; 6:1-23; 8:1-18,29-39; 10:9-10,13; 13:11-14.",
  },
  {
    n: 5,
    title: "The Church",
    body: "The universal Church is the entire Body of genuine believers in Christ throughout the ages from every tribe, and tongue, and people, and nation. A New Testament church of Christ is an autonomous local congregation of baptized believers, associated by covenant in the faith and fellowship of the gospel. The church observes two ordinances of Christ, governed by His laws, exercising gifts, rights, and privileges invested in them by His Word, and seeking to extend the gospel to the ends of the earth. Each church operates under the Lordship of Christ through democratic processes. In this type of congregation, each member is responsible and accountable to Christ as Lord. The scriptural officers of the church are elders (pastors) and deacons. Both men and women are gifted for service in the Church but the office of elder (pastor) is limited to men as qualified by Scripture.",
    refs: "Matthew 16:15-19; 18:15-20; Acts 2:41-42,47; 5:11-14; 6:3-6; 13:1-3; 14:23,27; 15:1-30; 16:5; 20:28; Romans 1:7; 1 Corinthians 1:2; 3:16; 5:4-5; 7:17; 9:13-14; 12; Ephesians 1:22-23; 2:19-22; 3:8-11,21; 5:22-32; Philippians 1:1; Colossians 1:18; 1 Timothy 2:9-14; 3:1-15; 4:14; Hebrews 11:39-40; 1 Peter 5:1-4; Revelation 2-3; 21:2-3",
  },
  {
    n: 6,
    title: "Baptism and the Lord's Supper",
    body: "Christian baptism is the immersion of a believer in water in the name of the Father, the Son, and the Holy Spirit. Baptism is an act of obedience which symbolizes the believer's faith in a crucified, buried, and risen Savior, the believer's death to sin, the burial of the old life, and the resurrection to walk in newness of life in Christ Jesus. Baptism is the prerequisite for the privileges of church membership and to the Lord's Supper. The Lord's Supper is a symbolic act of obedience whereby members of the church, through partaking of the bread and the fruit of the vine, commemorate the love of Christ as demonstrated through his death and resurrection. In so doing, the members of the church anticipate His second coming.",
    refs: "Matthew 3:13-17; 26:26-30; 28:19-20; Mark 1:9-11; 14:22-26; Luke 3:21-22; 22:19-20; John 3:23; Acts 2:41-42; 8:35-39; 16:30-33; 20:7; Romans 6:3-5; 1 Corinthians 10:16,21; 11:23-29; Colossians 2:12",
  },
  {
    n: 7,
    title: "The Lord's Day (Sunday)",
    body: "The first day of the week is the Lord's Day. It is a Christian institution for regular observance. It is a day that commemorates the resurrection of Christ from the dead and should include exercises of worship and spiritual devotion, both public and private. Activities on the Lord's Day's should be in accordance with the Christian's conscience under the Lordship of Jesus Christ.",
    refs: "Exodus 20:8-11; Matthew 12:1-12; 28:1ff.; Mark 2:27-28; 16:1-7; Luke 24:1-3,33-36; John 4:21-24; 20:1,19-28; Acts 20:7; Romans 14:5-10; I Corinthians 16:1-2; Colossians 2:16; 3:16; Revelation 1:10",
  },
  {
    n: 8,
    title: "The Kingdom of God",
    body: "The Kingdom of God includes both His general sovereignty over the universe and His particular reign over men who acknowledge Him as King. The Kingdom is particularly the realm of salvation into which men enter by faith and childlike commitment to Jesus Christ. Christians are to labor and pray that the Kingdom should come and God's will be done on earth. The full consummation of the Kingdom awaits the return of Jesus Christ and the end of the age.",
    refs: "Genesis 1:1; Isaiah 9:6-7; Jeremiah 23:5-6; Matthew 3:2; 4:8-10,23; 12:25-28; 13:1-52; 25:31-46; 26:29; Mark 1:14-15; 9:1; Luke 4:43; 1 Corinthians 15:24-28; Colossians 1:13; Hebrews 11:10,16; 12:28; 1 Peter 2:4-10; 4:13; Revelation 1:6,9; 5:10; 11:15; 21-22",
  },
  {
    n: 9,
    title: "Last Things",
    body: "God will bring the world to its ultimate end in His own time and His own way. According to Scripture, Jesus Christ will return personally and visibly in glory to the earth. Then, the dead will be raised, and Christ will judge all men in righteousness. The unrighteous will be consigned to Hell, the place of everlasting punishment. The righteous in their resurrected and glorified bodies will receive their reward and will dwell with the Lord forever in Heaven.",
    refs: "Isaiah 2:4; 11:9; Matthew 16:27; 18:8-9; 19:28; 24:27,30,36,44; 25:31-46; 26:64; Mark 8:38; 9:43-48; Luke 12:40,48; 16:19-26; 17:22-37; 21:27-28; John 14:1-3; Acts 1:11; 17:31; Romans 14:10; 1 Corinthians 4:5; 15:24-28,35-58; 2 Corinthians 5:10; Philippians 3:20-21; Colossians 1:5; 3:4; 1 Thessalonians 4:14-18; 5:1ff.; Jude 14; Revelation 1:18; 3:11; 20:1-22:13",
  },
  {
    n: 10,
    title: "Evangelism and Missions",
    body: "It is the duty of every Christian man and woman, and the duty of every church of Christ to seek to extend the gospel to the ends of the earth and to make disciples of all nations. The new birth of man's spirit by God's Holy Spirit means the birth of love for others. The Lord Jesus Christ has commanded the preaching of the gospel to all nations. It is the duty of every child of God to seek constantly to win the lost to Christ by verbal witness undergirded by a Christian lifestyle, and by all other methods sanctioned by the gospel of Christ as the greatest manifestation of this love.",
    refs: "Genesis 12:1-3; Exodus 19:5-6; Isaiah 6:1-8; Matthew 9:37-38; 10:5-15; 13:18-30, 37-43; 16:19; 22:9-10; 24:14; 28:18-20; Luke 10:1-18; 24:46-53; John 14:11-12; 15:7-8,16; 17:15; 20:21; Acts 1:8; 2; 8:26-40; 10:42-48; 13:2-3; Romans 10:13-15;",
  },
  {
    n: 11,
    title: "Stewardship",
    body: "God is the source of all blessings, temporal and spiritual; all that we have and are we owe to Him. We are therefore under obligation to serve Him with our time, talents, and material possessions; and should recognize all these as entrusted to us for the glory of God and the helping of others. All Christians should cheerfully, regularly, and systematically contribute of their means to the advancing of the cause of Christ on earth.",
    refs: "Genesis 14:20; Leviticus 27:30-32; Deuteronomy 8:18; Malachi 3:8-12; Matthew 6:1-4,19-21; 19:21; 23:23; 25:14-29; Luke 12:16-21,42; 16:1-13; Acts 2:44-47; 5:1-11; 17:24-25; 20:35; Romans 6:6-22; 12:1-2.",
  },
];
