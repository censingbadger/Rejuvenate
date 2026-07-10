/*
 * Rejuvenate Inc. — case simulation content model.
 *
 * Single source of truth shared by the server (require) and both front-ends
 * (script tag). Everything an instructor might want to tweak — narrative text,
 * decision options, metric effects, endings, teaching notes — lives here.
 *
 * Case © Jessica Siegel Christian (2025). Simulation adaptation of the
 * original "choose your own adventure" teaching notes.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SIM = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var META = {
    title: 'Rejuvenate',
    subtitle: 'An employee-wellness leadership simulation',
    caseTitle: 'Rejuvenate Inc. — Pioneering Employee Wellness in a Digital Age',
    copyright: 'Case © Jessica Siegel Christian (2025), assisted by ChatGPT. Interactive simulation adaptation for classroom use.',
    version: 1
  };

  /* ------------------------------------------------------------------ *
   * Culture metrics                                                     *
   * Starting values are anchored to the case's survey findings.         *
   * ------------------------------------------------------------------ */
  var METRICS = [
    { id: 'wellbeing',    label: 'Employee wellbeing',    icon: '❤',  start: 38,
      blurb: '65% work 55+ hour weeks; 45% report declining physical health.' },
    { id: 'trust',        label: 'Trust in leadership',   icon: '🤝', start: 45,
      blurb: 'Employees doubt that serious concerns will actually be acted on.' },
    { id: 'alignment',    label: 'Leadership alignment',  icon: '🧭', start: 50,
      blurb: 'The CEO fears productivity loss; the finance director fears costs.' },
    { id: 'productivity', label: 'Sustainable output',    icon: '⚙',  start: 62,
      blurb: 'Work ships, but on caffeine and weekends — fatigue is mounting.' }
  ];

  /* ------------------------------------------------------------------ *
   * Briefing chapters (the case, staged for play)                       *
   * ------------------------------------------------------------------ */
  var BRIEFING = [
    {
      id: 'company',
      kicker: 'San Francisco · Founded 2016',
      title: 'The company',
      paragraphs: [
        'Rejuvenate Inc. was founded in 2016 by dynamic duo Carla Martinez and Brian Fisher, both Stanford graduates with a passion for leveraging technology to improve well-being. In just six years, the company has grown to 300 employees with an annual revenue of $50 million. Positioned in the heart of San Francisco, they’ve attracted some of the brightest minds with their cutting-edge applications promoting health in the digital age.',
        'Their products have helped users lose weight and stay healthy, and have generally received fantastic reviews from consumers and industry experts.'
      ],
      products: [
        { name: 'VitaAI', desc: 'AI-powered mobile app for personalized nutrition advice and meal plans.', position: '500,000+ downloads in its first year.' },
        { name: 'MindScape VR', desc: 'Virtual-reality meditation and stress relief with real-time biometric feedback.', position: 'Adopted across high-stress industries and therapy clinics.' },
        { name: 'FitFlow Wearables', desc: 'Smartwatches and bands tracking vitals, with nudges to hydrate and take breaks.', position: 'A rising challenger to the leading brands.' },
        { name: 'EcoHab Smart Home', desc: 'AI-driven air, light, and kitchen devices for a healthier home environment.', position: 'Nascent, but predicted to grow rapidly.' }
      ],
      closer: 'However, the irony remains: a company so deeply rooted in promoting health and wellness is having difficulties ensuring the well-being of its own workforce. The glittering facade of Rejuvenate’s success hides an undercurrent of tension.'
    },
    {
      id: 'rajan',
      kicker: 'Your role',
      title: 'You are Rajan Patel',
      paragraphs: [
        'You grew up in Mumbai in a family of educators. Your mother, a school principal, emphasized the balance between academic pursuits and personal well-being; your father, a college professor, worked hard but was home for family dinner almost every evening — and taught you squash on the weekends.',
        'You studied Organizational Psychology at the University of Delhi, spent an exchange year at Oxford, and earned a master’s at Harvard researching the intersection of technology, workplace culture, and employee mental health. Then you spent a decade on Google’s famed People Operations team, spearheading initiatives around holistic wellness and work-life balance.',
        'Six months ago you left Google to become HR Director at Rejuvenate. Google gave you well-established programs; Rejuvenate offers the chance to build something from the ground up — a challenge you were eager to take on.',
        'Outside work you travel solo to recharge, practice Vipassana meditation, and still play squash with friends. You know what a healthy relationship with work looks like. That’s exactly why what you’ve found here worries you.'
      ]
    },
    {
      id: 'problem',
      kicker: 'Month 6 · What you’re hearing',
      title: 'The problem',
      paragraphs: [
        'The vibrancy of the products contrasts sharply with the stress you observe among the people who build them. While the company thrives in the market, the office corridors whisper tales of burnout, strained relationships, and overwhelming workloads. Late-night emails and weekend meetings have become the norm.',
        'At first you hoped your perception was skewed by your transition from Google. But as days turned into weeks, and weeks into months, the stories became harder to ignore:'
      ],
      voices: [
        { from: 'Elena', role: 'Software Developer', text: 'I’ve not had a weekend off in two months. My back aches from these long hours, and I’ve started having panic attacks.' },
        { from: 'Jake', role: 'Product Manager', text: 'I joined because I believed in the mission, but the “hustle” culture here is stifling. I barely see my kids and I’m basically relying on caffeine and energy drinks to get through my day.' },
        { from: 'Liam', role: 'Senior Designer', text: 'The teams are so siloed. There’s a lack of communication, and it feels like we’re competing rather than collaborating.' },
        { from: 'Mira', role: 'Sales', text: 'My relationship with my partner is deteriorating. It’s the constant overload and stress… I don’t know how much longer I can do this.' }
      ]
    },
    {
      id: 'survey',
      kicker: 'Month 6 · The evidence',
      title: 'You run an internal survey',
      paragraphs: [
        'Based on your uneasy feeling from these informal chats, you conduct an internal survey. The results alarm you.'
      ],
      stats: [
        { value: 65, suffix: '%', label: 'work over 55 hours a week' },
        { value: 50, suffix: '%', label: 'feel stressed about meeting work expectations' },
        { value: 45, suffix: '%', label: 'report declining physical health since joining' },
        { value: 35, suffix: '%', label: 'feel their team-oriented work is not going well' }
      ],
      quotes: [
        { from: 'Marketing manager', text: 'It feels like there’s always another deadline. I barely have time for myself anymore.' },
        { from: 'Engineer', text: 'The bar is set so high. I constantly worry that I’m not doing enough, even though I’m always working.' },
        { from: 'Product manager', text: 'Between the long hours and the constant stress, I’ve gained weight and feel constantly exhausted.' }
      ],
      closer: 'Your mission goes beyond introducing a few wellness programs — the challenge is to shift the company’s cultural mindset. Any intervention will need buy-in from senior leadership and genuine commitment at every level. Employee well-being is not a luxury; it is a necessity. CEO Carla Martinez is skeptical that flexibility won’t hurt productivity, the finance director is watching every dollar, and long hours are worn here as a badge of honor. Where you start is up to you.'
    }
  ];

  /* ------------------------------------------------------------------ *
   * Decision 1 — the opening move                                       *
   * Colors: fixed categorical slots (trial=1 blue, forums=2 aqua,       *
   * pizza=3 yellow) — identity follows the branch everywhere.           *
   * ------------------------------------------------------------------ */
  var DECISION1 = {
    id: 'd1',
    timeLabel: 'Month 6 — your first major move',
    title: 'What should you do first?',
    intro: 'You have the survey, the stories, and six months of context. Leadership is watching how their new HR Director spends political capital. You can only lead with one move.',
    rationalePrompt: 'In one or two sentences — why this move? (Optional. Your instructor sees these for the class debrief.)',
    options: [
      {
        id: 'trial', letter: 'A', slot: 1,
        title: 'Pilot reduced hours in one department',
        text: 'First address the issues around extended work hours — but instead of a drastic policy shift, run a trial: one department (software development) drops from 55+ hours a week to a sustainable 40, and you measure what happens.',
        tag: 'Careful and evidence-driven',
        deltas: { wellbeing: 6, trust: 5, alignment: -3, productivity: 0 }
      },
      {
        id: 'forums', letter: 'B', slot: 2,
        title: 'Launch open listening forums',
        text: 'Initiate a series of open forums where employees are encouraged to share their concerns, suggestions, and experiences in a non-judgmental environment — and let what you hear shape the strategy.',
        tag: 'Listen before acting',
        deltas: { wellbeing: 4, trust: 10, alignment: 2, productivity: -2 }
      },
      {
        id: 'pizza', letter: 'C', slot: 3,
        title: 'Boost morale right away',
        text: 'Lift the mood at work immediately: introduce fun initiatives like “Pizza Fridays” and “Casual Tuesdays.” People are hurting now — show them something is changing this week.',
        tag: 'Fast and visible',
        deltas: { wellbeing: 2, trust: -2, alignment: 4, productivity: 0 }
      }
    ]
  };

  /* ------------------------------------------------------------------ *
   * Branches: what happens next + Decision 2                            *
   * ------------------------------------------------------------------ */
  var BRANCHES = {
    trial: {
      outcomeTitle: 'The pilot runs',
      timeLabel: 'Three months later',
      interlude: [
        'Software development moves to 40-hour weeks for a full quarter. The rest of the company watches — some hopeful, some rolling their eyes.',
        'Now the trial period has ended, and the data and feedback from the department land on your desk. Sprint velocity dipped in week one, then recovered. Code-review quality ticked up. Two engineers said it saved them from quitting; one team lead quietly worked Saturdays anyway to keep pace with an external deadline.'
      ],
      reactions: [
        { from: 'Elena', role: 'Software Developer', text: 'I played squash on a Tuesday. A TUESDAY. First time in a year I’ve felt like a person on a weeknight.' },
        { from: 'Carla Martinez', role: 'CEO', text: 'I’ll admit the sky didn’t fall. But one quarter, one team, one data point — don’t ask me to bet the roadmap on it yet.' },
        { from: 'Mira', role: 'Sales', text: 'Must be nice. Meanwhile sales is still grinding to close the quarter. When is it our turn?' }
      ],
      decision: {
        id: 'd2',
        timeLabel: 'Month 9 — the trial has ended',
        title: 'The pilot is done. What do you do with it?',
        intro: 'Other departments are asking when they get reduced hours. The CEO is asking whether the company can afford it. The data is promising but thin.',
        rationalePrompt: 'Why this call? (Optional — feeds the class debrief.)',
        options: [
          {
            id: 'iterate', letter: 'A',
            title: 'Dig into the results, then phase the rollout',
            text: 'Examine the quantitative data (productivity metrics, delivery times) and the qualitative side (morale, feedback). Run follow-up sessions with the pilot department to understand the pros and cons, refine the model, then extend it to the next department — monitoring as you go.',
            tag: 'Iterate and expand',
            deltas: { wellbeing: 12, trust: 10, alignment: 8, productivity: 6 }
          },
          {
            id: 'blanket', letter: 'B',
            title: 'Roll it out to every department this week',
            text: 'The pilot worked. Momentum matters, and people are hurting now — announce reduced hours across all departments immediately, effective this week.',
            tag: 'Strike while it’s hot',
            deltas: { wellbeing: -2, trust: -6, alignment: -10, productivity: -12 }
          }
        ]
      }
    },

    forums: {
      outcomeTitle: 'The forums open',
      timeLabel: 'Three months later',
      interlude: [
        'You run open forums across every team. The first sessions are guarded — then someone says the quiet part out loud, and the floodgates open. People talk about hours, about aching backs and skipped vacations, about teams competing instead of collaborating.',
        'You leave with a wealth of information and categorize the feedback into five buckets: Work Hours, Health Initiatives, Team Dynamics, Office Environment, and Work-Life Balance. Now the question is who turns feedback into action.'
      ],
      reactions: [
        { from: 'Jake', role: 'Product Manager', text: 'That’s the first time in three years anyone with a title asked me a question and actually wrote the answer down.' },
        { from: 'Liam', role: 'Senior Designer', text: 'Design and engineering ended up comparing notes after the session. Turns out we’ve been fighting the same broken handoff from opposite sides.' },
        { from: 'Carla Martinez', role: 'CEO', text: 'People seem energized. Just remember we raised expectations in those rooms, Rajan. If nothing visible happens next quarter, this backfires.' }
      ],
      decision: {
        id: 'd2',
        timeLabel: 'Month 9 — feedback in hand',
        title: 'Who decides what happens next?',
        intro: 'Five buckets of real problems, raised by the people living them. Expectations are officially up. Two ways to turn talk into action:',
        rationalePrompt: 'Why this call? (Optional — feeds the class debrief.)',
        options: [
          {
            id: 'team', letter: 'A',
            title: 'Stand up a cross-functional wellness team',
            text: 'Create a team spanning departments, job roles, and seniority levels, tasked with turning each bucket into actionable pilot programs — flexible schedules, offline weekends, a revamped breakroom — with a feedback loop to iterate on what works.',
            tag: 'Co-create the fix',
            deltas: { wellbeing: 24, trust: 20, alignment: 15, productivity: 10 }
          },
          {
            id: 'topdown', letter: 'B',
            title: 'Let senior management pick the initiatives',
            text: 'People are already overworked — asking them to also design the solutions feels like one more burden. You and the senior leadership team review the buckets and decide which initiatives to pursue.',
            tag: 'Protect people’s time',
            deltas: { wellbeing: -6, trust: -15, alignment: 3, productivity: -4 }
          },
          {
            id: 'consultants', letter: 'C',
            title: 'Hire an external firm to design a top-tier wellness strategy',
            text: 'Bring in a specialist wellness consultancy to design a best-in-class, benchmarked strategy. They’ve done this for bigger companies — let the experts build you a polished, comprehensive program.',
            tag: 'Buy in expertise',
            deltas: { wellbeing: 8, trust: -4, alignment: 8, productivity: 4 }
          }
        ]
      }
    },

    pizza: {
      outcomeTitle: 'Pizza Fridays begin',
      timeLabel: 'One month later',
      interlude: [
        'Every Friday, the smell of forty pizzas fills the office. Attendance is great — free pizza is free pizza. Casual Tuesdays get a few smiles too.',
        'A month in, you assess the impact, and the reactions are decidedly mixed. Some people genuinely enjoy the break. Others eat a slice at their desk without stopping work. The survey numbers haven’t moved.'
      ],
      reactions: [
        { from: 'Jake', role: 'Product Manager', text: 'Free pizza’s nice, I guess. I ate mine on a call. With my camera off. At 7pm.' },
        { from: 'Elena', role: 'Software Developer', text: 'Honestly? I’d trade all the pizzas for a day off.' },
        { from: 'Carla Martinez', role: 'CEO', text: 'Cheap, visible, people smiled — good instinct, Rajan. Is this the whole plan, or the opening act?' }
      ],
      decision: {
        id: 'd2',
        timeLabel: 'Month 7 — mixed reactions',
        title: 'The reactions are mixed. What now?',
        intro: 'Morale perks got you visibility and a little goodwill. The question is what you build on top of it — or whether you just order more of it.',
        rationalePrompt: 'Why this call? (Optional — feeds the class debrief.)',
        options: [
          {
            id: 'more', letter: 'A',
            title: 'Double down on perks',
            text: 'The enthusiasm reads as a win — extend the playbook with “Ice Cream Tuesdays” and monthly movie nights. Keep the energy up while you settle into the role.',
            tag: 'More of what’s working',
            deltas: { wellbeing: -10, trust: -14, alignment: -6, productivity: -8 }
          },
          {
            id: 'feedback', letter: 'B',
            title: 'Keep the pizza, add “Feedback Fridays”',
            text: 'Acknowledge that pizza isn’t a wellness strategy. Pair it with “Feedback Fridays” where people can voice concerns in a safe, open environment — and fund some immediate fixes like ergonomic workspace upgrades.',
            tag: 'Perks plus listening',
            deltas: { wellbeing: 8, trust: 8, alignment: 2, productivity: 2 }
          }
        ]
      }
    }
  };

  /* ------------------------------------------------------------------ *
   * Post-decision-2 reaction feeds (dramatized from the case outcomes)  *
   * ------------------------------------------------------------------ */
  var OUTCOME2_REACTIONS = {
    'trial:iterate': [
      { from: 'Dev team retro', role: 'Follow-up session', text: 'Keep the 40-hour cap, but give us protected focus blocks — meetings ate the time we got back.' },
      { from: 'Mira', role: 'Sales', text: 'Heard our department is next in the rollout, and that it’ll flex around end-of-quarter. Okay. That’s… actually thoughtful.' },
      { from: 'Carla Martinez', role: 'CEO', text: 'Phased, measured, reversible. This I can defend to the board.' }
    ],
    'trial:blanket': [
      { from: 'Priya', role: 'Marketing Lead', text: 'We’re four weeks from the EcoHab launch and you just cut my team’s hours by a third. How exactly do we make the date?' },
      { from: 'Mira', role: 'Sales', text: 'Same targets, fewer hours, no plan. I’m more stressed than before — now I’m just stressed faster.' },
      { from: 'Carla Martinez', role: 'CEO', text: 'Two launch dates slipped this month, Rajan. I backed a pilot, not a company-wide gamble. We need to talk.' }
    ],
    'forums:team': [
      { from: 'Wellness team', role: 'Week 6 update', text: 'Flexible-schedule pilot is live in two departments. Offline weekends start next month. Breakroom got real chairs and real snacks. Feedback wall is filling up.' },
      { from: 'Elena', role: 'Software Developer', text: 'Someone from the wellness team asked how the new schedule was working FOR ME. Then they changed a thing I flagged. I nearly cried.' },
      { from: 'Carla Martinez', role: 'CEO', text: 'Engagement scores are the best we’ve ever measured, and delivery hasn’t slipped. I’m ready to put a formal wellness policy in front of the board.' }
    ],
    'forums:topdown': [
      { from: 'All-hands announcement', role: 'From the leadership team', text: 'Introducing our new wellness program: mandatory monthly resilience seminars for all staff, plus a subscription to a generic mindfulness app.' },
      { from: 'Liam', role: 'Senior Designer', text: 'We told them the problem was hours and silos. They gave us a mandatory seminar… during lunch. Did anyone read what we said in those forums?' },
      { from: 'Jake', role: 'Product Manager', text: 'The seminar attendance sheet is the most honest metric in the company — everyone’s there, nobody’s listening.' }
    ],
    'forums:consultants': [
      { from: 'WellCorp Advisory', role: 'Consultant deliverable', text: 'Please find attached your 84-page Wellness Excellence Framework™, benchmarked against industry leaders, with a five-pillar maturity model and recommended vendor stack.' },
      { from: 'Elena', role: 'Software Developer', text: 'It’s… slick. But we spent hours in those forums telling you exactly what’s wrong here, and this reads like it could’ve been written for any company. Did any of that make it in?' },
      { from: 'Carla Martinez', role: 'CEO', text: 'It’s a professional piece of work and the board likes seeing a name-brand firm on it. I just can’t tell how much of it actually fits us — or whether people will believe in a plan they didn’t build.' }
    ],
    'pizza:more': [
      { from: 'Elena', role: 'Software Developer', text: 'Ice Cream Tuesdays. Sure. My back still hurts and I still worked Sunday, but sure — sprinkles.' },
      { from: 'Anonymous', role: 'Complaint box', text: 'I’d trade all the pizzas for a day off. (You’ve read forty versions of this note this month.)' },
      { from: 'Brian Fisher', role: 'Co-founder', text: 'Rajan, two senior engineers and our best designer resigned this month. Exit interviews all say the same thing: the perks feel like a distraction from the real problems.' }
    ],
    'pizza:feedback': [
      { from: 'Feedback Friday', role: 'Session notes', text: 'Top themes, week 4: workload and hours, cross-team communication, meeting overload. People say it’s the first time they’ve been asked.' },
      { from: 'Liam', role: 'Senior Designer', text: 'New chair, standing desk, and someone actually collecting our complaints instead of a box that eats them. Small things, but they’re real.' },
      { from: 'Carla Martinez', role: 'CEO', text: 'The feedback sessions are surfacing useful things. I’m listening. What I haven’t seen yet is your plan for the big stuff — hours, workload, the culture itself.' }
    ]
  };

  /* ------------------------------------------------------------------ *
   * Decisions 3, 4 & 5 — universal OB-research dilemmas every student    *
   * faces regardless of their strategic path. Some are deliberately      *
   * non-obvious (a tempting option that isn't the best). Tiers: strong / *
   * mixed (a solid-but-limited middle) / weak. Every option carries its  *
   * own metric deltas, coaching feedback, and employee reactions.        *
   * Options are colored by neutral identity slots so nothing telegraphs  *
   * quality before the choice is made.                                   *
   * ------------------------------------------------------------------ */
  var DECISION3 = {
    id: 'd3',
    reportLabel: 'Scaling the pilot',
    kicker: 'Month 10 — scaling the experiment',
    timeLabel: 'Month 10 — the reduced-hours question goes company-wide',
    outcomeTitle: 'You choose how to scale',
    title: 'How do you take reduced hours company-wide?',
    intro: 'A saner schedule has shown real promise in the teams that have tried it, and word has spread. Now the executive team wants a plan to extend it across the whole company — engineering, sales, marketing, support. How you roll it out will matter as much as the policy itself, because these teams do very different work.',
    rationalePrompt: 'Why this call? (Optional — feeds the class debrief.)',
    options: [
      {
        id: 'standardize', letter: 'A', slot: 1,
        title: 'Standardize it — same reduced hours and clear targets for every team',
        text: 'One clean, company-wide policy: the same reduced hours for everyone, with clear performance targets attached so output stays protected. Consistent, fair, and easy to announce and audit.',
        tag: 'One rule for all',
        verdict: 'mixed',
        deltas: { wellbeing: 5, trust: 0, alignment: 6, productivity: -2 },
        interlude: 'You roll out one uniform policy across the company. Leadership loves how clean it is. Then the teams whose work doesn’t fit the template start to strain.',
        feedback: {
          title: 'Clean — but one size doesn’t fit all',
          text: 'Standardizing is appealing: it looks fair and it’s easy to communicate. But teams do genuinely different work — sales lives on quarter-end targets, engineering on incident load — so identical hours plus identical targets everywhere ignores those differences and leaves no room to learn and adjust. Bolting “clear performance targets” onto reduced hours can even intensify the squeeze. It helps some teams and strains others, because a policy applied equally isn’t the same as one applied appropriately.'
        },
        reactions: [
          { from: 'Priya', role: 'Engineering Lead', text: 'The same rule for marketing-at-launch and support-on-call and us? Those jobs aren’t alike. There’s no room to adapt it to how we actually work.' },
          { from: 'Mira', role: 'Sales', text: 'Reduced hours AND the same aggressive targets? At quarter-end that math just doesn’t close. Whoever wrote this doesn’t do my job.' },
          { from: 'Carla Martinez', role: 'CEO', text: 'One clear policy for everyone — I can defend that to the board all day. Just keep an eye on the teams it doesn’t quite fit.' }
        ]
      },
      {
        id: 'refine', letter: 'B', slot: 2,
        title: 'Follow up, refine on feedback, and scale gradually',
        text: 'Don’t assume the pilot transfers. Run follow-ups with the teams that tried it, learn what broke and what held, refine the model, and extend it team by team — letting each team’s reality shape the rollout.',
        tag: 'Iterate and scale',
        verdict: 'strong',
        deltas: { wellbeing: 10, trust: 10, alignment: 8, productivity: 8 },
        interlude: 'You treat the rollout as a series of experiments, not an announcement. Each team you add teaches you something the last one didn’t, and the model gets sharper.',
        feedback: {
          title: 'Why this works — the feedback-loop lesson',
          text: 'This is the iterative, evidence-driven approach. You don’t assume the pilot transfers untouched — you run follow-ups, learn what to keep and what to fix, and scale gradually so each team’s reality shapes the model. It adapts to the differences between teams instead of steamrolling them, and it builds trust because people watch their feedback actually change the plan. Slower than a big announcement, and far more durable.'
        },
        reactions: [
          { from: 'Elena', role: 'Software Developer', text: 'They asked how the first rollout actually went before pushing it to us, then changed the parts that hadn’t worked. It feels built for how we really work.' },
          { from: 'Carla Martinez', role: 'CEO', text: 'Slower than I’d like — but every team we add goes smoother than the last, and nothing’s blown up. Hard to argue with the trend line.' }
        ]
      },
      {
        id: 'resilience', letter: 'C', slot: 3,
        title: 'Keep the pilot; give other teams resilience & time-management training',
        text: 'Maintain reduced hours where they’re already working, and for the rest of the company, invest in resilience training and time-management workshops so people can better handle the pressure they’re under.',
        tag: 'Build coping skills',
        verdict: 'mixed',
        deltas: { wellbeing: 4, trust: -2, alignment: 4, productivity: 2 },
        interlude: 'The pilot teams keep their saner hours. Everyone else gets a calendar invite to a resilience workshop. The reaction splits along exactly that line.',
        feedback: {
          title: 'Helpful — but it shifts the burden onto people',
          text: 'Keeping the pilot going is good, and coping skills aren’t worthless. But offering the other teams “training” instead of structural change quietly relocates the problem onto individuals — *you* manage your stress, *you* budget your time — while the 55-hour weeks and the workload that caused the burnout stay exactly where they are. OB calls these secondary, individual-level interventions: they treat the symptom, not the system, and people notice when they’re handed a workshop instead of a fix.'
        },
        reactions: [
          { from: 'Jake', role: 'Product Manager', text: 'A time-management workshop. My problem isn’t that I can’t read a calendar — it’s that there’s three people’s work on it. But sure, I’ll learn to breathe.' },
          { from: 'Mira', role: 'Sales', text: 'The pilot teams got their hours back. We got a webinar on resilience. Message received.' }
        ]
      }
    ]
  };

  var DECISION4 = {
    id: 'd4',
    reportLabel: 'Retention crisis',
    kicker: 'Month 11 — a retention crisis',
    timeLabel: 'Month 11 — a resignation letter on your desk',
    outcomeTitle: 'You make the retention call',
    title: 'How do you stop the bleeding?',
    intro: 'Elena — your best developer, the one who first told you about the panic attacks — just got an outside offer for 30% more. HR analytics flags five more senior people as flight risks. In the budget meeting, the CFO’s instinct is fast and familiar: “Put money on the table — a company-wide retention bonus. We can’t afford to lose these people.” Everyone turns to you.',
    rationalePrompt: 'Why this call? (Optional — feeds the class debrief.)',
    options: [
      {
        id: 'bonus', letter: 'A', slot: 1,
        title: 'Put money on the table',
        text: 'Back the CFO: a headline retention bonus and a stock refresh for everyone flagged as a flight risk. Match the outside offers where you have to. Show people they’re valued — in the clearest language there is.',
        tag: 'Pay to retain',
        verdict: 'weak',
        deltas: { wellbeing: 1, trust: -4, alignment: 6, productivity: -3 },
        interlude: 'The bonuses land in accounts by month’s end. For a few weeks the resignation talk goes quiet, and the CFO looks vindicated. Then the mood curdles into something more cynical.',
        feedback: {
          title: 'Why this backfires',
          text: 'This is the reflex — and the research says it misfires. Money is a “hygiene factor” (Herzberg): it can stop dissatisfaction for a moment but it doesn’t create motivation. Worse, large tangible rewards can *crowd out* the intrinsic, mission-driven pull that brings people to a wellness company in the first place (the overjustification effect; self-determination theory). You’ve signaled that suffering is the deal and you’ll pay for it — so people bank the bonus and leave anyway once it vests.'
        },
        reactions: [
          { from: 'Elena', role: 'Software Developer', text: 'A bonus to stay and keep having panic attacks? I didn’t want to be paid more to suffer. I wanted the suffering to stop. I’m still taking the other offer.' },
          { from: 'Devon', role: 'Finance Director', text: 'The optics were great for exactly three weeks. Now I’ve spent half a year’s wellness budget and my attrition forecast barely moved.' }
        ]
      },
      {
        id: 'rework', letter: 'B', slot: 2,
        title: 'Fix why they’re leaving, not just the paycheck',
        text: 'Treat the resignations as data, not a bidding war. Cut the unsustainable workload that’s driving people out, give teams real autonomy over how they work, and make sure pay is genuinely *fair* — but lead with the work, not a bonus.',
        tag: 'Address the root cause',
        verdict: 'strong',
        deltas: { wellbeing: 10, trust: 12, alignment: 4, productivity: 6 },
        interlude: 'You sit with the flight-risk list and ask a different question: not “what will keep them?” but “why do they want to go?” The answer isn’t money — it’s the grind. So you change the grind.',
        feedback: {
          title: 'Why this works',
          text: 'The research is on your side. Pay is a hygiene factor — necessary and it must be fair, but it doesn’t motivate. What retains skilled, mission-driven people is intrinsic: autonomy, mastery, and purpose (self-determination theory). By attacking the workload and restoring control over their work — while quietly fixing genuine pay inequities — you address what people are actually leaving over. It’s cheaper than the bonus and it lasts.'
        },
        reactions: [
          { from: 'Elena', role: 'Software Developer', text: 'They didn’t counter my offer with cash — they gave me my evenings back and a say in what I build. I turned the other job down.' },
          { from: 'Priya', role: 'Engineering Lead', text: 'First time leadership treated resignations as a diagnosis instead of a hostage negotiation. My whole team noticed.' }
        ]
      },
      {
        id: 'fairpay', letter: 'C', slot: 3,
        title: 'Fair pay, plus some relief',
        text: 'Run a pay-equity review and correct the people who are genuinely underpaid, and lighten the worst of the crunch. A targeted fix for the clearest problems, without a company-wide splash.',
        tag: 'Targeted correction',
        verdict: 'mixed',
        deltas: { wellbeing: 5, trust: 5, alignment: 5, productivity: 2 },
        interlude: 'You quietly right the clearest pay inequities and ease a few of the worst deadlines. It’s not dramatic, and it genuinely helps — though it doesn’t reach everyone.',
        feedback: {
          title: 'A solid, partial fix',
          text: 'Sensible: correcting real pay inequities removes a legitimate dissatisfier (fair pay is table stakes), and easing the crunch helps. But you stopped at the edges — you didn’t redesign the work itself, so the intrinsic drivers (autonomy, mastery, purpose) are only partly restored. You’ll keep more people than the bonus ever would, but not all of the ones you most wanted to.'
        },
        reactions: [
          { from: 'Elena', role: 'Software Developer', text: 'The pay correction was fair and overdue. It helped. I’m staying — for now — but the hours are still the hours.' },
          { from: 'Mira', role: 'Sales', text: 'Nice that they fixed the underpaid folks. Some of us are still drowning, though — money was never really the thing.' }
        ]
      }
    ]
  };

  var DECISION5 = {
    id: 'd5',
    reportLabel: 'The performance bar',
    kicker: 'Month 12 — quarterly planning',
    timeLabel: 'Month 12 — setting next quarter’s targets',
    outcomeTitle: 'You reset the bar',
    title: 'What do you do about the “bar”?',
    intro: 'Quarterly planning. The punishing stretch goals — the famous “bar is set so high” — are exactly what’s burning people out. But leadership also credits them for the growth, and the VP of Product wants next quarter’s targets from you by Friday. Three schools of thought are on the table.',
    rationalePrompt: 'Why this call? (Optional — feeds the class debrief.)',
    options: [
      {
        id: 'nogoals', letter: 'A', slot: 1,
        title: 'Take the pressure off — no targets',
        text: 'The goals are the problem, so remove them. Scrap the quarterly targets, tell people to pace themselves and protect their health, and trust professionals to do good work without a number hanging over them.',
        tag: 'Ease the pressure',
        verdict: 'weak',
        deltas: { wellbeing: -2, trust: -3, alignment: -8, productivity: -12 },
        interlude: 'You announce it in the all-hands: no quarterly targets this cycle — “do your best and take care of yourselves.” There’s a round of applause. Then, slowly, a strange fog rolls in.',
        feedback: {
          title: 'The compassionate-looking trap',
          text: 'It *feels* like the pro-wellness call — which is exactly why it’s the trap. Decades of goal-setting research (Locke & Latham) find that “do your best” reliably *underperforms* specific, challenging goals. And the ambiguity backfires on wellbeing itself: with no clear expectations, people can’t tell when they’ve done enough, so many work *more* and worry *more*, not less. You didn’t remove the pressure — you removed the finish line, and left everyone running in the dark.'
        },
        reactions: [
          { from: 'Jake', role: 'Product Manager', text: 'No targets sounded like heaven. In practice I have no idea if I’m doing enough, so I just… never stop. It’s somehow more stressful.' },
          { from: 'Carla Martinez', role: 'CEO', text: 'Rajan, we have no roadmap commitments this quarter and the board meets in six weeks. I asked you to make the goals humane, not to delete them.' }
        ]
      },
      {
        id: 'cocreate', letter: 'B', slot: 2,
        title: 'Set the goals with the teams — and change what you measure',
        text: 'Keep goals, but reset them *with* the people who hit them: participative targets, a mix of output and learning goals, a cap on sustainable workload, and wellbeing metrics sitting in the same scorecard as delivery.',
        tag: 'Challenging and humane',
        verdict: 'strong',
        deltas: { wellbeing: 12, trust: 12, alignment: 6, productivity: 10 },
        interlude: 'You run planning as a negotiation instead of a decree. Teams set targets they believe in, name what they need to learn, and — for the first time — see “recovery” and “sustainable pace” on the same dashboard as ship dates.',
        feedback: {
          title: 'Why this works',
          text: 'You threaded the needle the research draws. Goal-setting theory (Locke & Latham) says specific, challenging goals genuinely drive performance — so you keep them. But the documented “dark side” (Ordóñez et al., *Goals Gone Wild*) shows narrow, high-pressure goals cause tunnel vision, corner-cutting, and burnout — so you add learning goals, participation (which raises commitment and ownership), and wellbeing guardrails. Challenging *and* humane, which most undergraduates are taught to see as a contradiction.'
        },
        reactions: [
          { from: 'Liam', role: 'Senior Designer', text: 'We set the target ourselves, so we own it — and there’s a learning goal in there, not just a ship date. I’ve never worked harder or felt saner.' },
          { from: 'Carla Martinez', role: 'CEO', text: 'We still have ambitious commitments for the board — and the team actually believes in them. I didn’t know you could have both.' }
        ]
      },
      {
        id: 'moderate', letter: 'C', slot: 3,
        title: 'Dial the targets back from the top',
        text: 'Keep leadership in charge of the numbers, but set them at a saner level: clearer, more specific, less punishing SMART goals, and ease the worst of the crunch.',
        tag: 'Sustainable, top-down',
        verdict: 'mixed',
        deltas: { wellbeing: 6, trust: 4, alignment: 6, productivity: 6 },
        interlude: 'You bring more reasonable targets down from leadership — specific, sustainable, clearly stated — and pull back the harshest deadlines. It’s a real improvement, and people feel it.',
        feedback: {
          title: 'A real improvement — with a ceiling',
          text: 'Genuinely better: specific, sustainable goals beat both punishing stretch targets and vague ones, and easing the crunch helps morale immediately. But setting them top-down leaves commitment on the table — participation is what turns a goal from imposed to owned. And with only output metrics and no learning goals, you’re still measuring people on delivery alone. Good, not transformative.'
        },
        reactions: [
          { from: 'Elena', role: 'Software Developer', text: 'Saner numbers, clearly stated — I’ll take it. Would’ve meant more if they’d asked us, but I’m not complaining.' },
          { from: 'Jake', role: 'Product Manager', text: 'At least I know what the target is now, and it’s reachable. Still feels handed-down, but it’s a lot better than the old bar.' }
        ]
      }
    ]
  };

  /* ------------------------------------------------------------------ *
   * Decision feedback — the "why this worked / didn't" coaching shown    *
   * on the outcome screen, so students can learn and optionally rethink. *
   * Wording is grounded in Jess's teaching-note outcomes (verified       *
   * against the slide deck): the path labels (Most Positive / Medium /   *
   * Not so effective) and each Path 1 vs Path 2 outcome list.            *
   * verdict: strong (green) | mixed (amber) | weak (red).                *
   * ------------------------------------------------------------------ */
  var FEEDBACK = {
    d1: {
      forums: {
        verdict: 'strong',
        title: 'The strongest opening',
        text: 'In Jess’s notes this is the most positive first move. Listening first surfaces the five real problem buckets — Work Hours, Health Initiatives, Team Dynamics, Office Environment, Work-Life Balance — and builds the trust every later intervention depends on. One catch: you’ve raised expectations in those rooms, so what you do with the feedback next is everything.'
      },
      trial: {
        verdict: 'mixed',
        title: 'A solid but narrow opening',
        text: 'This is the “medium” path in Jess’s notes: a credible, evidence-driven start. A one-department trial gives you real data and a defensible story for skeptical leadership. Its limit is scope — it tackles work hours only, so the broader culture issues (silos, the “hustle” badge of honor, well-being) still wait their turn.'
      },
      pizza: {
        verdict: 'weak',
        title: 'Why perks alone fall short',
        text: 'Jess flags this as the least effective opening. “Pizza Fridays” lifts the mood for a moment, but it doesn’t touch the 55-hour weeks, the silos, or the burnout. Employees enjoy the perk — yet if it’s the whole plan, distrust grows as their serious concerns feel downplayed. What you do next matters enormously.'
      }
    },
    d2: {
      'forums:team': {
        verdict: 'strong',
        title: 'Why this worked',
        text: 'Path 1 — and the best outcome in Jess’s notes. A cross-functional team turns feedback into pilots (flexible schedules, offline weekends, a revamped breakroom), rapid feedback loops refine them, and it builds to a formal wellness policy, external consultants, ergonomic furniture, and Mindful Mondays. Employees feel valued and heard; absenteeism drops and engagement soars; “hustle” gives way to “health-first.”'
      },
      'forums:topdown': {
        verdict: 'weak',
        title: 'Why this fell short',
        text: 'You gathered five buckets of employee feedback, then decided without them. Generic, top-down initiatives borrowed from other companies miss Rejuvenate’s actual problems, and mandatory seminars breed resentment. In Jess’s framing, employees feel disconnected and skeptical of the intent — soliciting voice and then overruling it costs more trust than never asking.'
      },
      'forums:consultants': {
        verdict: 'mixed',
        title: 'Polished, but whose plan is it?',
        text: 'A competent, benchmarked strategy is better than a mandatory-seminar mandate — and leadership likes a credible name on it. But you just ran forums that surfaced Rejuvenate’s specific problems, then handed the design to outsiders, so the plan reads as generic and the employee voice you gathered goes unused. Procedural justice research is clear: people commit to changes they help shape. Expertise can inform the fix; it can’t substitute for ownership.'
      },
      'trial:iterate': {
        verdict: 'strong',
        title: 'Why this worked',
        text: 'Path 1 — the iterative approach. Examining both the quantitative data (productivity, delivery times) and the qualitative side, plus follow-up sessions, means challenges get addressed promptly; a phased rollout minimizes disruption; and morale rises as other departments anticipate their turn. Jess’s notes say this can bend toward the most positive outcomes.'
      },
      'trial:blanket': {
        verdict: 'weak',
        title: 'Why this fell short',
        text: 'Rolling the change out to everyone at once ignores department-specific needs — sales and marketing hit peak seasons with the same targets and fewer hours. With no mechanism to capture feedback, problems surface as missed deadlines and reputation risk, and the response is mixed. A pilot is evidence, not a mandate.'
      },
      'pizza:more': {
        verdict: 'weak',
        title: 'Why this fell short',
        text: 'Doubling down on “Ice Cream Tuesdays” and movie nights without addressing root causes reads as leadership being out of touch. The novelty wears off, the events become distractions, dissatisfaction rises — “I’d trade all the pizzas for a day off” becomes the refrain — and turnover climbs, top talent first.'
      },
      'pizza:feedback': {
        verdict: 'mixed',
        title: 'A genuine course correction',
        text: 'Keeping “Pizza Fridays” in proportion and adding “Feedback Fridays” plus ergonomic fixes helps employees feel more valued and heard, and morale ticks up with fewer pain points. But as Jess notes, the deeper systemic issues — hours, workload, silos — are still present and waiting for a real strategy.'
      }
    }
  };

  /* ------------------------------------------------------------------ *
   * Endings — "one year later" epilogues                                *
   * tone: great | good | mixed | poor | bad (icon + word, never color   *
   * alone). rank orders endings best → worst for the debrief.           *
   * ------------------------------------------------------------------ */
  var ENDINGS = {
    'forums:team': {
      id: 'forums:team', rank: 1, tone: 'great', icon: '🌱',
      title: 'The Culture Transformer',
      summary: [
        'One year in, Rejuvenate feels like a different company. The cross-functional wellness team turned forum feedback into pilots — flexible schedules, offline weekends, a revamped breakroom — and rapid feedback loops let you refine each one until it stuck.',
        'With the results in hand, you and senior leadership drafted a formal wellness policy: limited work hours, flexible schedules, mandated breaks. External consultants rounded out programs for physical, mental, and emotional health. The uncomfortable chairs people complained about in the forums? Replaced with ergonomic furniture. Some Monday meetings gave way to “Mindful Mondays” guided meditation.',
        'Absenteeism and health complaints are down. Engagement scores have soared. The culture is shifting from “hustle” to “health-first” — and customers have noticed a company that finally practices what its products preach.'
      ],
      bullets: [
        'Employees feel valued and heard — motivation and ownership are up',
        'Cross-functional voices made initiatives comprehensive and relevant',
        'Feedback loops let programs be refined until they actually worked',
        'A formal wellness policy now protects hours, flexibility, and breaks',
        'Absenteeism down, engagement soaring, customer trust growing'
      ],
      lesson: 'Listening created trust; co-creation converted it into change that stuck. Employee voice plus iteration beats any single program.'
    },
    'trial:iterate': {
      id: 'trial:iterate', rank: 2, tone: 'good', icon: '📈',
      title: 'The Evidence Builder',
      summary: [
        'The phased rollout worked the way good experiments do: each department surfaced its own challenges, and each round of feedback made the model better. Departments with unique rhythms — sales at quarter-end, marketing around launches — got adaptations instead of mandates.',
        'A year in, most of the company runs on sustainable hours, morale is up, and there’s a positive buzz as remaining teams anticipate their turn. Leadership trusts the data trail you built.',
        'And yet — hours were only ever one of the five problems employees are living with. Team silos, the office environment, the deeper “hustle” identity: those are still waiting for their own experiment. The incremental changes are appreciated, but many employees feel more could be done in line with the company’s mission.'
      ],
      bullets: [
        'Challenges surfaced early and were addressed promptly',
        'Phased adaptation minimized operational disruption',
        'Anticipation of “our turn” built trust in leadership',
        'Modest overall improvement — but underlying issues persist'
      ],
      lesson: 'Evidence and iteration earn credibility. The risk of the careful path: solving the measurable problem while the cultural one waits.'
    },
    'pizza:feedback': {
      id: 'pizza:feedback', rank: 3, tone: 'mixed', icon: '🔄',
      title: 'The Course Correction',
      summary: [
        'You caught it in time. Pizza stayed — as pizza, nothing more — and “Feedback Fridays” slowly became the real event. People noticed the ergonomic upgrades landed within weeks of being requested, and that someone was finally writing their concerns down.',
        'A year in, morale has ticked up and several pain points are visibly better. Employees feel more valued and heard than they did.',
        'But the deeper systemic issues — the 55-hour weeks, the deadline pressure, the siloed teams — are still present, logged every Friday and still waiting for a strategy big enough to meet them. You bought back goodwill; the culture change hasn’t started yet.'
      ],
      bullets: [
        'Perks kept as morale boosters, not mistaken for strategy',
        'Feedback channels made people feel heard; quick wins built credibility',
        'A slight uptick in morale and reduced pain points',
        'Systemic issues — hours, workload, silos — remain unaddressed'
      ],
      lesson: 'Recognizing a superficial fix and correcting course rebuilds trust — but listening only pays off when it leads somewhere.'
    },
    'forums:consultants': {
      id: 'forums:consultants', rank: 4, tone: 'mixed', icon: '💼',
      title: 'The Off-the-Shelf Strategy',
      summary: [
        'The consultancy delivered — a glossy, benchmarked wellness framework with maturity models and a vendor stack. On paper, Rejuvenate now has a “best-in-class” program, and the board is reassured to see a name-brand firm’s logo on the plan.',
        'Some of it genuinely helps: the mental-health vendor is good, the ergonomic standards are real. But a year in, the framework sits at maybe half-adoption. Employees who poured specifics into the forums see a generic plan that could have been written for any company, and a plan you didn’t build together is a plan few feel they own.',
        'You spent real money and bought a competent starting point — but you also let the trust and energy from those forums cool while outsiders did the thinking. The strategy is fine; the buy-in never fully arrived.'
      ],
      bullets: [
        'A polished, benchmarked strategy — competent and credible to the board',
        'Some components (mental-health vendor, ergonomics) genuinely land',
        'But it reads as generic; the specific forum feedback goes largely unused',
        'Low ownership — people don’t commit to a plan they didn’t help shape'
      ],
      lesson: 'Outside expertise can inform a fix, but it can’t manufacture ownership. Procedural justice — people commit to what they help build — is why co-creation beats even a professionally designed plan.'
    },
    'trial:blanket': {
      id: 'trial:blanket', rank: 5, tone: 'poor', icon: '⚠',
      title: 'Too Much, Too Fast',
      summary: [
        'The announcement got applause in the all-hands and chaos in the calendar. Sales hit quarter-end with a third fewer hours and the same targets. Marketing’s launch slipped, then slipped again. No feedback mechanism existed to catch any of it — you found out about problems when they became missed deadlines.',
        'Some employees genuinely love the shorter weeks. Others are more stressed than before, compressing the same workload into less time. Customer-support response times drew public complaints, and the company’s reputation took a bruise inside and out.',
        'A year in, the CEO has quietly re-authorized “temporary” overtime for three departments. The idea was right; the rollout burned the credibility it needed.'
      ],
      bullets: [
        'One department’s results didn’t transfer — no customization for unique demands',
        'Missed deadlines and delayed launches strained leadership trust',
        'Mixed employee response: relief for some, compressed stress for others',
        'Reputation risk internally and externally; partial rollback within a year'
      ],
      lesson: 'A pilot is evidence, not a mandate. Scaling a result without understanding why it worked — or building feedback to catch where it doesn’t — turns a win into a cautionary tale.'
    },
    'forums:topdown': {
      id: 'forums:topdown', rank: 6, tone: 'poor', icon: '📉',
      title: 'Heard, Then Overruled',
      summary: [
        'The forums raised expectations; the top-down decisions broke them. Leadership picked generic solutions borrowed from other companies — mandatory wellness seminars, an app subscription — with little connection to the five buckets employees had painstakingly filled.',
        'Employees feel disconnected from decisions they were explicitly asked to inform. The mandatory seminars breed quiet resentment: another hour of the workweek spent, ironically, on wellness theater.',
        'A year in, trust is lower than before the forums. The next time HR asks for honest input, the silence is instructive. “They asked, we answered, they did something else” has become company folklore.'
      ],
      bullets: [
        'Employees disconnected from decision-making; skepticism about intent',
        'Generic, top-down initiatives missed Rejuvenate’s actual problems',
        'Mandatory seminars bred resentment, not wellness',
        'Asking-then-ignoring damaged trust more than never asking'
      ],
      lesson: 'Soliciting voice creates an obligation to use it. Feedback that disappears into a leadership room is worse than no feedback process at all.'
    },
    'pizza:more': {
      id: 'pizza:more', rank: 7, tone: 'bad', icon: '🍕',
      title: 'The Pizza Paradox',
      summary: [
        'The novelty wore off fast. Ice Cream Tuesdays and movie nights came to feel like distractions — proof, people said, that leadership didn’t understand the real problems. The complaint box filled; nothing visible came out of it. A one-time stress-management workshop only sharpened the irony.',
        '“I’d trade all the pizzas for a day off” became the company’s unofficial motto, muttered in Slack channels you’re not in.',
        'A year in, dissatisfaction is higher than when you arrived. Turnover is up, especially among top talent, and Glassdoor reviews now use the phrase “pizza culture” as a warning. The wellness company’s wellness problem has become an industry punchline — and your credibility to attempt something real has largely been spent.'
      ],
      bullets: [
        'Novelty faded; perks read as distractions from real problems',
        'Leadership seen as out of touch; cynicism and irony spread',
        'Complaint box + one-off workshop signaled concerns were being downplayed',
        'Turnover rose — top talent first — with negative word-of-mouth in the industry'
      ],
      lesson: 'Perks are seasoning, not the meal. Surface fixes on a systemic problem don’t just fail — they actively teach employees that leadership isn’t serious.'
    }
  };

  /* ------------------------------------------------------------------ *
   * Final reflection — the top-3 initiatives assignment                 *
   * ------------------------------------------------------------------ */
  var REFLECTION = {
    timeLabel: 'Epilogue — your recommendation memo',
    title: 'Your top three initiatives',
    intro: 'Simulation over — step out of the story. Based on everything you saw on your path, pick the three initiatives you believe would have the most impact on employee wellness at Rejuvenate, in priority order.',
    justificationPrompt: 'Justify your picks in 2–4 sentences, as if writing to CEO Carla Martinez and the finance director. They’ll ask about productivity and cost — what’s the return on this investment?',
    initiatives: [
      { id: 'flexible_hours', label: 'Flexible work hours', desc: 'Start anywhere from 7–10am and work an 8-hour day.' },
      { id: 'remote_work', label: 'Remote work, 2 days a week', desc: 'Operations are mostly digital — let people work from home twice a week.' },
      { id: 'hours_policy', label: 'Formal limits on work hours', desc: 'A company policy capping hours, with flexible schedules and mandated breaks.' },
      { id: 'wellness_programs', label: 'On-site wellness programs', desc: 'Weekly yoga and meditation classes, plus a dedicated relaxation zone.' },
      { id: 'mental_health', label: 'Mental-health support', desc: 'Partner with a mental-health platform for counseling and support.' },
      { id: 'nutrition', label: 'Nutrition seminars & healthy catering', desc: 'Monthly nutritionist seminars with catered healthy lunch options.' },
      { id: 'feedback_forums', label: 'Standing feedback forums', desc: 'Regular open forums so employee voice continuously shapes decisions.' },
      { id: 'crossfunc_team', label: 'Cross-functional wellness team', desc: 'A standing team across departments and seniority levels that owns wellness initiatives.' },
      { id: 'ergonomics', label: 'Ergonomic office upgrades', desc: 'Proper chairs, adjustable desks, and a workspace that doesn’t hurt.' },
      { id: 'mindful_mondays', label: 'Mindful Mondays', desc: 'Replace some Monday meetings with guided meditation and relaxation.' }
    ]
  };

  /* ------------------------------------------------------------------ *
   * Teaching notes — powers the facilitation tab                        *
   * ------------------------------------------------------------------ */
  var TEACHING = {
    d1Notes: {
      forums: {
        pathLabel: 'Most positive path',
        note: 'Listening first builds the trust every later intervention depends on. In the original notes this is the strongest opening: it surfaces the five real problem buckets (work hours, health initiatives, team dynamics, office environment, work-life balance) and creates legitimate expectations of action.'
      },
      trial: {
        pathLabel: 'Medium path',
        note: 'A credible, evidence-driven opening. It produces data and a defensible story for skeptical leadership, but scopes the intervention to hours only — the broader cultural issues wait. Overall: incremental changes are appreciated, modest improvement, underlying issues persist.'
      },
      pizza: {
        pathLabel: 'Not-so-effective path',
        note: 'Surface-level perks without systemic change. Employees appreciate immediate perks, but excessive hours, team dynamics, and well-being remain unaddressed; distrust grows as serious concerns feel downplayed. Watch for students choosing speed/visibility — a genuinely tempting instinct for a new leader.'
      }
    },
    d2Notes: {
      'trial:iterate': 'Iterative approach: challenges addressed promptly, phased rollout minimizes disruption, morale improves as departments anticipate their turn. Can feed into the positive direction from Decision 1.',
      'trial:blanket': 'Surface-level read of the feedback, immediate company-wide rollout, no feedback mechanism. Departments with unique demands (sales, marketing at launch) struggle; missed deadlines; mixed employee response; reputation risk.',
      'forums:team': 'Cross-functional team → pilots (flexible schedule, offline weekends, revamped breakroom) → feedback loops → formal wellness policy, consultants, ergonomic furniture, Mindful Mondays. Absenteeism drops, engagement soars, hustle → health-first.',
      'forums:topdown': 'Top-down decisions after soliciting voice: generic solutions, mandatory seminars. Employees feel disconnected; initiatives lack relevance; resentment grows. Key teaching moment: asking-then-ignoring is worse than not asking.',
      'forums:consultants': 'Mid-tier: an external firm delivers a polished, benchmarked strategy — competent and board-friendly, better than a top-down mandate. But it sidelines the forum feedback, reads as generic, and lands at low adoption because employees don’t own a plan they didn’t build. Teaching point: procedural justice — expertise informs, it doesn’t create ownership.',
      'pizza:more': 'Doubling down on perks: novelty wears off, events read as distractions, leadership seems out of touch. “I’d trade all the pizzas for a day off.” Turnover rises, especially top talent; negative industry word-of-mouth.',
      'pizza:feedback': 'Partial recovery: perks kept in proportion, Feedback Fridays + ergonomic fixes make people feel heard. Slight uptick in morale; deeper systemic issues still present.'
    },
    // OB-research dilemmas. Where a "trap" is set, it's the option students most often pick.
    d3Notes: {
      concept: 'Change management: contingency & feedback loops',
      research: 'Contingency thinking (one size does not fit all — different teams, different work); iterative, feedback-driven change (refine-and-scale — the class feedback-loop lesson); and the limits of secondary, individual-level interventions (resilience / stress-management training shifts responsibility onto individuals without changing the work — primary vs. secondary/tertiary interventions in occupational-health research).',
      best: 'refine',
      note: 'No outright-wrong answer here, but only B builds in learning. A (standardize + targets for every team) treats different teams as identical and piles on pressure — no room to test and refine. C (resilience / time-management training) is the subtle trap: it looks supportive but relocates the fix onto individuals ("manage your own stress") while the workload stays put. Ask the class: which option changes the system, and which just asks people to cope with it?',
      options: {
        standardize: 'Middle — one uniform policy + targets for all. Clean and board-friendly, but ignores department differences and leaves no room to test and refine.',
        refine: 'Strong — follow-ups, refine on feedback, scale gradually. The feedback-loop lesson; adapts to team differences and builds trust.',
        resilience: 'Middle — keep the pilot, train everyone else in resilience / time management. A secondary, individual-level fix that shifts the burden onto employees without structural change.'
      }
    },
    d4Notes: {
      concept: 'Motivation: intrinsic vs. extrinsic',
      research: 'Herzberg’s two-factor theory (pay is a hygiene factor, not a motivator); Self-Determination Theory (Deci & Ryan — autonomy, competence, relatedness); the overjustification effect (large extrinsic rewards can crowd out intrinsic motivation).',
      trap: 'bonus',
      trapNote: 'The retention bonus is the reflexive, “obvious” move and the one to watch for. It feels decisive and even generous, but it treats a hygiene factor as if it were a motivator, is expensive, buys only a quarter of quiet, and signals “we’ll pay you to suffer.” Great moment to ask: why doesn’t more money fix this?',
      options: {
        bonus: 'Weak — pay as the headline fix. Hygiene factor; temporary; can crowd out intrinsic, mission-driven motivation. People bank it and leave.',
        rework: 'Strong — attack the workload and restore autonomy/mastery/purpose; fix pay fairness quietly. Cheaper and durable; addresses why people actually leave.',
        fairpay: 'Middle — correct genuine pay inequities + ease the crunch. Removes a real dissatisfier but leaves the work itself unredesigned; keeps some, not all.'
      }
    },
    d5Notes: {
      concept: 'Goal-setting theory and its dark side',
      research: 'Locke & Latham’s goal-setting theory (specific, challenging goals beat “do your best”); participative goal-setting raises commitment; learning vs. performance goals; the “dark side” (Ordóñez, Schweitzer, Galinsky & Bazerman — Goals Gone Wild: narrow high-pressure goals cause tunnel vision, unethical shortcuts, and burnout).',
      trap: 'nogoals',
      trapNote: 'Abolishing goals is the counterintuitive trap — it looks like the compassionate, pro-wellness choice, so many undergraduates pick it. But “do your best” underperforms specific goals, and ambiguity raises anxiety (people can’t tell when they’ve done enough). Key teaching point: the humane answer isn’t no goals, it’s better goals, set with people.',
      options: {
        nogoals: 'Weak — scrap targets, “do your best.” Underperforms specific goals; ambiguity increases stress; leadership loses roadmap. The pro-wellness-looking backfire.',
        cocreate: 'Strong — participative goals + learning goals + wellbeing guardrails. Keeps goal-setting’s power, defuses its dark side. Challenging and humane.',
        moderate: 'Middle — moderate, clearer top-down SMART goals + less crunch. Real improvement, but leaves commitment (participation) and learning goals on the table.'
      }
    },
    discussionQuestions: [
      {
        topic: 'Product vs. culture dissonance',
        questions: [
          'Why is there a mismatch between Rejuvenate’s product line promoting health and its internal culture?',
          'How might the company’s product ethos influence — or be influenced by — its internal culture?'
        ]
      },
      {
        topic: 'ROI of wellness',
        questions: [
          'Can wellness initiatives provide a tangible return on investment? How can it be quantified?',
          'What indirect benefits might not be immediately measurable but contribute to long-term gains?'
        ]
      },
      {
        topic: 'Changing established cultures',
        questions: [
          'What challenges are inherent in trying to shift an established company culture?',
          'How can leaders — especially from HR — effect positive cultural transformations?'
        ]
      },
      {
        topic: 'Employee voice and engagement',
        questions: [
          'How important is it to regularly seek employee feedback about work environment and well-being?',
          'How can companies ensure the feedback process is genuine and not a perfunctory exercise?'
        ]
      }
    ],
    lecturePoints: [
      { title: 'The wellness–productivity link', text: 'Studies indicate a direct correlation between employee well-being and productivity: better focus, reduced absenteeism, improved collaboration.' },
      { title: 'Cultural lag', text: 'Fast-growing companies can outgrow their internal cultures. The lag creates a mismatch between external image and internal reality — exactly Rejuvenate’s situation.' },
      { title: 'Comprehensive wellness', text: 'Wellness is physical, mental, emotional, and even financial. Addressing one facet without the others is rarely effective.' },
      { title: 'Leadership’s role', text: 'Leadership buy-in is crucial. If leaders don’t walk the talk, grassroots initiatives falter — note how CEO alignment moves through the simulation.' },
      { title: 'The importance of feedback', text: 'Regular feedback loops, formal and informal, are the foundation of any successful HR strategy — and the differentiator between this simulation’s best and worst endings.' },
      { title: 'Adapting to modern work realities', text: 'Remote work, gig economies, digital nomadism: companies that reassess traditional work models gain a competitive advantage.' },
      { title: 'Beyond the fiction', text: 'Rejuvenate is fictional, but real companies face these exact challenges — bring in examples of wellness programs that worked and what they measured.' }
    ],
    obstacles: [
      { title: 'Resistant management', text: 'The CEO fears flexible hours and remote work could decrease productivity.' },
      { title: 'Costs', text: 'The finance director points out that wellness initiatives incur additional costs.' },
      { title: 'Hustle culture', text: 'Long hours are seen as a badge of honor — the culture itself resists the fix.' }
    ],
    assignment: 'Small groups: prepare notes recommending the top three initiatives with the most impact on Rejuvenate’s employee wellness, justifying each with supporting data or research. (The simulation collects each student’s individual top-3 ranking and justification as raw material for this discussion.)',
    theoryLens: {
      title: 'Leadership lens: directive vs. participative',
      intro: 'The decision tree quietly runs an adaptive-leadership experiment. Culture change is a complex, novel problem — and the class results usually show the participative moves outperforming the directive ones.',
      styles: [
        { style: 'Participative', matches: 'Open forums · Cross-functional team · Feedback Fridays', text: 'Encourage everyone to share what they know, surface additional ideas, decide together. Best for complex, unfamiliar problems — like shifting a culture — where the knowledge is distributed across the team.' },
        { style: 'Directive', matches: 'Top-down initiative picks · Company-wide blanket rollout', text: 'Tell people what you need, make the call yourself. Efficient for simple or familiar problems — but applied to a complex one, it discards the collective knowledge the forums just gathered.' }
      ],
      functions: {
        title: 'Three functions of team leadership (map each path against them)',
        items: [
          { name: 'Manage activity', text: 'Set direction and motivate movement — a compelling vision, structures and processes that support it. (Which endings actually changed the structure of work?)' },
          { name: 'Manage task ability', text: 'Coordinate toward the goal — strategize, use the team’s collective knowledge, counteract biases. (The cross-functional team is this function, institutionalized.)' },
          { name: 'Manage relationships', text: 'Enable collaboration and viability — shared identity, positive climate, feedback and coaching. (Perks aimed here but skipped the feedback half.)' }
        ]
      },
      punchline: 'Ask the class: when WOULD the directive move have been right? (A simple, urgent, well-understood problem — not this one.)'
    },
    runOfShow: [
      { phase: 'Join & setup', minutes: 5, detail: 'Project the join link and class code. Students enter names; watch the roster fill on the dashboard.' },
      { phase: 'Individual play — briefing & Decision 1', minutes: 10, detail: 'Students read the case chapters and lock in their first move. Use the timer; the funnel shows who is still reading.' },
      { phase: 'Individual play — Decisions 2–5', minutes: 16, detail: 'Follow-through, then the three OB dilemmas (scaling the pilot, retention crisis, the performance bar), each with feedback. Endings and the leadership report card reveal. Nudge stragglers via the progress column.' },
      { phase: 'Reflection memo', minutes: 5, detail: 'Students rank their top-3 initiatives and justify them to the CEO/finance director — feeds the leaderboard.' },
      { phase: 'Debrief', minutes: 25, detail: 'Switch to Debrief mode and walk the slides: participation → Decision 1 → branches → endings → metrics → initiative leaderboard → theory lens → discussion questions.' }
    ],
    debriefFlow: [
      'Open with participation and the Decision 1 split — ask one student per option to defend their opening move before revealing any outcomes.',
      'Walk each branch: what happened, what the second decision was, how the class split. Ask students who diverged to explain what they weighed.',
      'Reveal the endings map best-to-worst. Highlight that the two “listening” moves (forums, feedback) only pay off when voice leads to action.',
      'Show the class metric averages — connect leadership-alignment swings to the ROI discussion questions.',
      'Use the initiative leaderboard and student justifications to seed the small-group assignment.'
    ]
  };

  /* ------------------------------------------------------------------ *
   * Progression & scoring                                               *
   * ------------------------------------------------------------------ */
  var STEPS = ['briefing', 'decision1', 'outcome1', 'decision2', 'outcome2', 'decision3', 'outcome3', 'decision4', 'outcome4', 'decision5', 'outcome5', 'ending', 'reflection', 'done'];

  function stepIndex(step) { return STEPS.indexOf(step); }

  function optById(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function d1Option(id) { return optById(DECISION1.options, id); }

  function d2Option(branchId, id) {
    var branch = BRANCHES[branchId];
    return branch ? optById(branch.decision.options, id) : null;
  }

  // The three universal decisions, in flow order.
  var UNIVERSAL = { d3: DECISION3, d4: DECISION4, d5: DECISION5 };
  var UNIVERSAL_ORDER = ['d3', 'd4', 'd5'];
  function udDecision(point) { return UNIVERSAL[point] || null; }
  function udOption(point, id) { return UNIVERSAL[point] ? optById(UNIVERSAL[point].options, id) : null; }
  function d3Option(id) { return udOption('d3', id); }
  function d4Option(id) { return udOption('d4', id); }
  function d5Option(id) { return udOption('d5', id); }

  function endingFor(d1, d2) {
    return ENDINGS[d1 + ':' + d2] || null;
  }

  function clamp(v) { return Math.max(0, Math.min(100, v)); }

  /* Recompute metric values from decisions — the server treats this as
   * authoritative so client state can never drift from the content model. */
  function computeMetrics(decisions) {
    var values = {}, i, m;
    for (i = 0; i < METRICS.length; i++) values[METRICS[i].id] = METRICS[i].start;
    var stages = [{ label: 'Start', values: assign({}, values) }];

    function apply(deltas, label) {
      for (var k in deltas) {
        if (Object.prototype.hasOwnProperty.call(deltas, k) && Object.prototype.hasOwnProperty.call(values, k)) {
          values[k] = clamp(values[k] + deltas[k]);
        }
      }
      stages.push({ label: label, values: assign({}, values) });
    }

    var opt1 = decisions && decisions.d1 ? d1Option(decisions.d1.choice) : null;
    if (opt1) apply(opt1.deltas, 'After decision 1');
    var opt2 = (opt1 && decisions.d2) ? d2Option(opt1.id, decisions.d2.choice) : null;
    if (opt2) apply(opt2.deltas, 'After decision 2');
    // Universal decisions 3→4→5, each applies only if the chain before it did.
    var chain = opt2, n = 3;
    UNIVERSAL_ORDER.forEach(function (pt) {
      var opt = (chain && decisions && decisions[pt]) ? udOption(pt, decisions[pt].choice) : null;
      if (opt) apply(opt.deltas, 'After decision ' + n);
      chain = opt; n++;
    });

    return { values: values, stages: stages };
  }

  // The "leadership report card": each decision + how it graded.
  // Verdicts: strong (2) / mixed (1) / weak (0). Bands are ratio-based so the
  // grade holds up as the number of decisions changes.
  var GRADE_BANDS = [
    { min: 0.85, label: 'Exemplary', blurb: 'Call after call that holds up. This is what evidence-based, humane leadership looks like.' },
    { min: 0.6, label: 'Strong, with gaps', blurb: 'Mostly sound judgment, with a call or two that left value — or people — on the table.' },
    { min: 0.35, label: 'Uneven', blurb: 'Some real instincts, undercut by choices that looked right but worked against you.' },
    { min: 0, label: 'Struggling', blurb: 'The reflexive, obvious moves dominated — and the research explains why they misfired.' }
  ];

  function verdictScore(v) { return v === 'strong' ? 2 : v === 'mixed' ? 1 : 0; }

  function decisionScorecard(decisions) {
    var items = [];
    if (decisions.d1) {
      var o1 = d1Option(decisions.d1.choice), v1 = (FEEDBACK.d1[decisions.d1.choice] || {}).verdict;
      items.push({ label: 'Opening move', title: o1 ? o1.title : decisions.d1.choice, verdict: v1 });
    }
    if (decisions.d1 && decisions.d2) {
      var o2 = d2Option(decisions.d1.choice, decisions.d2.choice), v2 = (FEEDBACK.d2[decisions.d1.choice + ':' + decisions.d2.choice] || {}).verdict;
      items.push({ label: 'Follow-through', title: o2 ? o2.title : decisions.d2.choice, verdict: v2 });
    }
    UNIVERSAL_ORDER.forEach(function (pt) {
      if (!decisions[pt]) return;
      var o = udOption(pt, decisions[pt].choice);
      items.push({ label: UNIVERSAL[pt].reportLabel, title: o ? o.title : decisions[pt].choice, verdict: o ? o.verdict : null });
    });
    return items;
  }

  function leadershipGrade(decisions) {
    var items = decisionScorecard(decisions);
    var score = 0, max = items.length * 2;
    items.forEach(function (it) { score += verdictScore(it.verdict); });
    var ratio = max ? score / max : 0;
    var band = GRADE_BANDS[GRADE_BANDS.length - 1];
    for (var i = 0; i < GRADE_BANDS.length; i++) { if (ratio >= GRADE_BANDS[i].min) { band = GRADE_BANDS[i]; break; } }
    return { score: score, max: max, label: band.label, blurb: band.blurb, items: items };
  }

  // Universal-decision feedback lives on the option itself.
  function optionFeedback(opt) {
    if (!opt || !opt.feedback) return null;
    return { verdict: opt.verdict, title: opt.feedback.title, text: opt.feedback.text };
  }

  function assign(target, src) {
    for (var k in src) if (Object.prototype.hasOwnProperty.call(src, k)) target[k] = src[k];
    return target;
  }

  function initiativeById(id) {
    for (var i = 0; i < REFLECTION.initiatives.length; i++) {
      if (REFLECTION.initiatives[i].id === id) return REFLECTION.initiatives[i];
    }
    return null;
  }

  // Feedback for the decision the student just made.
  // point 'd1' → keyed by choice; point 'd2' → keyed by "d1choice:d2choice".
  function feedbackFor(point, d1, d2) {
    if (point === 'd1') return FEEDBACK.d1[d1] || null;
    if (point === 'd2') return FEEDBACK.d2[d1 + ':' + d2] || null;
    return null;
  }

  return {
    META: META,
    METRICS: METRICS,
    BRIEFING: BRIEFING,
    DECISION1: DECISION1,
    BRANCHES: BRANCHES,
    OUTCOME2_REACTIONS: OUTCOME2_REACTIONS,
    DECISION3: DECISION3,
    DECISION4: DECISION4,
    DECISION5: DECISION5,
    UNIVERSAL_ORDER: UNIVERSAL_ORDER,
    udDecision: udDecision,
    udOption: udOption,
    FEEDBACK: FEEDBACK,
    feedbackFor: feedbackFor,
    optionFeedback: optionFeedback,
    ENDINGS: ENDINGS,
    REFLECTION: REFLECTION,
    TEACHING: TEACHING,
    STEPS: STEPS,
    stepIndex: stepIndex,
    d1Option: d1Option,
    d2Option: d2Option,
    d3Option: d3Option,
    d4Option: d4Option,
    d5Option: d5Option,
    endingFor: endingFor,
    computeMetrics: computeMetrics,
    decisionScorecard: decisionScorecard,
    leadershipGrade: leadershipGrade,
    initiativeById: initiativeById
  };
});
