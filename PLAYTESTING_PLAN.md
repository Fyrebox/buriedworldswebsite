# Buried Worlds VR — paid playtester recruitment plan

Prepared 9 September 2026. Proposal only: no recruitment post, invitations, payments or website changes have been made.

## Recommendation

Recruit 12 adult Meta Quest owners from r/playtesters. Pay US$30 for a test with a 60-minute active-time cap, provide an evaluation key after selection, and collect feedback privately through the website. Start with four testers, fix the main problems, then test with eight fresh players. Reserve six optional 30-minute retests at US$15 each.

This plan assumes the VR game described by this website, rather than the separate Reddit companion game. The website currently lists Quest 2, Quest 3, Quest 3S and Quest Pro, English and French, and seated or standing play. Confirm the intended build and supported devices in the Meta dashboard before opening recruitment; the live store page could not be fetched during research.

## Fees and budget

| Item | Quantity | Rate | Budget |
| --- | ---: | ---: | ---: |
| First wave | 4 | US$30 | US$120 |
| Second wave, fresh players | 8 | US$30 | US$240 |
| Optional retests, separately invited | 6 | US$15 | US$90 |
| Transfer costs, replacements and exceptional setup time | Reserve | — | US$90 |
| Total planned cash budget | | | **US$540** |

The core research costs US$360. The remaining US$180 is reserved, not automatically spent. Keys are additional access, never a deduction from cash compensation. Website development and the developer's own review time are outside this budget. Review the reserve before inviting replacements; payment already earned is owed even if the reserve runs out.

US$30 is a proposed recruitment rate, not a claimed industry standard. It is intended to attract suitable headset owners while paying for setup and reporting as well as play. For context, PlaytestCloud currently describes US$5–9 for a 15-minute playtest plus survey; that is a mobile-testing comparator, not a VR rate card. [Source](https://players.playtestcloud.com/article/118-rewards-a-summary)

Use PayPal cash payments as the default. Confirm that the selected tester can receive the payment in their country before issuing a key. Budget sender and recipient transaction charges so the agreed USD amount reaches their PayPal balance; explain that any later currency conversion or withdrawal can change the local-currency proceeds. Use the payment type appropriate to paid services. Do not offer gift cards, raffles, crypto or bug bounties for this first campaign.

## Who to recruit

- Age 18 or over, with personal access to a supported Quest headset and working controllers.
- Able to understand the brief and provide feedback in English; include two French-language game sessions if suitable bilingual applicants are available.
- New to Buried Worlds VR for the main study. Existing players can be considered for retesting separately.
- Able to complete within five calendar days of receiving a working key and the brief.
- Willing to supply a short private gameplay recording, or an agreed screenshot-and-notes alternative.
- One paid main-study place per person. No professional QA experience required.

Aim for four Quest 2, four Quest 3, three Quest 3S and one Quest Pro tester. These are sampling targets, not quotas to delay the study indefinitely. If Pro recruitment fails, replace that slot and record the coverage gap. Include both occasional and frequent VR players, at least four people who already enjoy exploration or simulation games, and some seated and left-handed play where naturally represented.

Select for device coverage, relevant interests and clear communication. Do not select by follower count or enthusiasm for giving a positive review. Keep four eligible applicants on a waitlist without asking them to install or perform unpaid testing. If several applicants are equally suitable, choose randomly within the needed device group.

## What the paid test includes

Target 60 active minutes: 10 for setup and submission administration, 40 for gameplay, and 10 for the questionnaire. Breaks and unattended downloads do not count. If setup or uploading needs more active time, reduce gameplay so the total remains 60 minutes, or agree extra paid time before proceeding. Do not require completing every mechanic or destination.

1. Start a fresh save. Let the player discover the opening without coaching for approximately 10 minutes.
2. Ask them to attempt detecting, digging, panning, storing and selling finds. Treat being unable to discover or finish an action as a research result.
3. If progression allows, investigate travel. Otherwise capture what they believe the next goal is.
4. Save, exit and relaunch once to check whether progress returns as expected.
5. Submit the short questionnaire and evidence through their private study page.

Request a gameplay-only recording of the first 10–15 minutes. Voice commentary is welcome but optional; no webcam or room footage is required. Agree the screenshot-and-notes alternative before starting for people who cannot record. Explain how to avoid capturing account menus and notifications. Do not make full-session recording or public video uploading a condition.

Questionnaire, designed to take no more than 10 minutes:

- What did you think your first goal was, and where did you first become unsure?
- Which actions did you attempt, and which could you finish without help?
- What felt satisfying, repetitive or frustrating? Give a specific example where possible.
- Did movement, reach, controls or reading text cause difficulty? Did discomfort make you stop?
- Did saving and resuming work?
- Did you encounter any bugs? If so: expected result, actual result, steps and supporting evidence where available. “No bugs noticed” is valid.
- What is the single most useful change we could make?
- Would you choose to play again without payment, and why?

Include headset, game version, language and approximate active time. Avoid word-count requirements. The existing in-game feedback form can supplement this, but must not be the only payment evidence: it uses a random install identifier and is not linked to a named applicant. Do not silently link it to applicants or add gameplay tracking for this study.

## Website registration and administration

Add a dedicated `/playtest` page at www.buriedworlds.com. This is a proposed route, not an existing registration page. Show the pay, active-time cap, headset requirements, study steps, selection process, key terms, payment timing and privacy notice before the form. Identify the operator consistently with the existing site: Melvia Pty Ltd / Bellare Studios.

Application fields:

- Contact email, verified through a time-limited email link.
- Reddit username, for application context; no Reddit password or mandatory account connection.
- Country and time zone, for payment availability and scheduling.
- 18+ confirmation; no birth date or identity-document upload.
- Headset model, VR experience, relevant game interests and whether they have already played Buried Worlds VR.
- Game language, seated/standing preference, handedness, and recording capability.
- Availability over the next week and confirmation they can receive PayPal cash payments.
- Acceptance of the displayed study terms and acknowledgement of the privacy notice.
- Separate, unticked optional consent for future playtest invitations.

Do not collect PayPal addresses from all applicants. Ask selected testers privately when they accept their invitation. Collect a Meta-account email only if a private release-channel invitation is actually needed.

Flow: apply → verify email → developer selects → receive offer with exact deadline and terms → accept within 48 hours → receive key and private brief → submit → receive approval or specific correction request → receive payment confirmation.

Application acknowledgement must say that applying does not guarantee selection or payment, and that applicants should wait for an accepted invitation before doing any testing. Send waitlist/decline outcomes when selection closes.

Use a private participant page accessed through expiring email sign-in links. Keep study identifiers out of public URLs and analytics wherever possible; never expose keys or payment details to third-party analytics, referral headers or public pages. The study pages should omit GA4. Aggregate campaign visits and application counts are sufficient.

Minimum developer dashboard: application status, device/language, invitation and due dates, accepted terms version, key assignment, submission/evidence, correction status, amount owed, payment date and transaction reference. Use durable database storage and private file storage. Assign each key once. Keep access restricted to the study operator and mask payment details in routine views. Add duplicate-submission protection, rate limiting and backups. Start with manual selection and manual payments; a payment API is unnecessary for 12 people.

The existing website has Express/Pug pages, PostgreSQL campaign tracking, an admin login and in-game feedback intake. It has no applicant registration, email verification, private research uploads or payout workflow. Reuse appropriate foundations, but keep research contact/payment data separate from anonymous game feedback.

Before registration launches, revise every affected privacy statement: the current policy says there is no sign-up form, no contact-data collection and no identifiable website records. Explain the study's contact data, country, payment details, footage, storage providers, access and deletion process. Proposed retention: delete unsuccessful applications after 30 days; delete study recordings and operational contact data 90 days after final payment unless a dispute remains open; retain de-identified findings. Keep payment/accounting records separately for the applicable required retention period, confirmed before publishing the notice. Future-invitation consent must be optional and revocable. Internal research permission does not include permission to use a recording or quotation in marketing.

## Evaluation keys

Generate a small named Meta key batch for the campaign and test redemption before inviting participants. Give one key per selected tester only after acceptance; never publish a key list, issue keys automatically on application, or ask testers to buy and seek reimbursement. Meta supports redeemable app keys and separate release channels for limited testing. [Source](https://developers.meta.com/horizon/policy/distribution-options/)

For the first wave, use the released version unless the research specifically requires an unreleased fix. For later fixes, verify the selected build in a private release channel before issuing instructions. A store key alone is not a promise that a tester has the intended unreleased build.

Recommended terms: the key is free for the selected person's own evaluation; it must not be sold, transferred, shared or posted. Let testers keep their redeemed copy. Do not describe ordinary store keys as automatically expiring, or use access revocation as a response to criticism. Any temporary private-build access should have an end date stated separately in the invitation. The key is not cash compensation and has no cash alternative. Testers never owe its retail price if they withdraw.

No public store review, wishlist, social follow, Discord membership or promotional post is required. Keep private-build materials confidential if relevant, with the specific scope and end date disclosed before acceptance; do not impose a blanket restriction on honest opinions about the released game.

## Payment conditions

Publish these conditions before application and repeat them in the invitation:

| Situation | Decision |
| --- | --- |
| Selected tester completes the agreed session and submits their own game-specific questionnaire and agreed evidence | Pay US$30. |
| Negative opinion, no bugs found, or player cannot complete a gameplay goal | Pay in full when the agreed process is completed. |
| A game defect, invalid supplied key or VR discomfort prevents completion | Stop testing; provide a short report and available evidence. Pay the full US$30 for a genuine commenced attempt. No repeated exposure required. |
| Recording fails | Accept available screenshots and specific notes through the correction process; do not demand an unpaid replay. |
| Missing answers, unreadable file or inaccessible upload | Specify exactly what is missing within three business days and allow seven calendar days to correct it. |
| Additional testing is useful | Send a separate optional US$15 offer for up to 30 active minutes. Main-session pay remains independent. |
| Tester withdraws for another reason after starting | Pay for documented active time at US$0.50/minute, capped at US$30. |
| Developer cancels after a tester accepts | Pay US$10 if they have not begun, or full US$30 if they have begun. |
| Unselected applicant, no-show with no work, duplicate claim or demonstrably fabricated/copied submission | No payment for that claim; explain the specific reason and offer a seven-day appeal for disputed evidence. |

Check submissions within three business days. Initiate payment within seven calendar days of a complete submission; do not restart the payment clock merely because review was delayed. If a correction is necessary, explain it before that deadline and pay within seven calendar days of receipt. Provider processing time is additional and should be disclosed. An invalid payment address requires a correction, not forfeiture; retain the payable balance until resolved. Send the amount, currency, date and reference when payment is sent, and distinguish sent, failed and received where verifiable.

No subjective “only useful feedback gets paid” clause, minimum bug count, rating threshold or discretionary prize. If a tester misses the submission deadline, contact them and allow one reasonable extension before closing the slot. Work already performed must be handled under the withdrawal/payment terms. Agree any additional substantive work in advance at the same US$30/hour rate; simple clarification of an existing answer is different from another test session.

## Recruitment and timetable

r/playtesters requires text posts under its published posting guidelines. For the Paid Playtest flair, offer actual cash, state the amount, briefly describe the game and specify how feedback is collected. Keys alone would not qualify. [Posting guidelines](https://www.reddit.com/r/playtesters/comments/1jccyez/new_post_guidelines/)

The visible community rules prohibit promotional posts unrelated to finding testers and limit posting to twice per week. Keep the recruitment post focused on the research opportunity and link directly to registration; omit store-purchase and follower requests. Recheck the rules immediately before publishing. [Community rules](https://www.reddit.com/r/playtesters/)

Suggested sequence, relative to the website being ready:

- Days 1–3: publish one post, collect applications and invite four pilot testers. Keep remaining suitable applicants informed.
- Days 4–8: run the pilot, review and pay promptly; identify the few most important fixes.
- Days 9–12: implement and verify fixes. Invite the next eight fresh testers only when the next build is ready.
- Days 13–19: complete the second wave and pay on the same timetable. Invite up to six targeted retests only where results will answer a specific question.
- Close: label the Reddit post and application page closed, notify the waitlist, and record findings and outstanding payments.

If fewer than four eligible headset owners apply within five days, make one factual recruitment update within the posting limit. If still short, report the recruitment gap before broadening the channel or raising the fee. Do not mass-message subreddit members. Schedule research around build readiness rather than rushing fixes to meet illustrative dates.

## Draft Reddit post

Publish only after the registration page, terms, key redemption and payment route have been tested.

**Title:** [Paid] US$30 for a 60-minute Buried Worlds VR playtest — Meta Quest owners, 18+

Hi! I'm the developer of Buried Worlds VR, a treasure-hunting game where you use a metal detector, dig for finds, pan for gold and explore historical locations.

I'm recruiting 12 adult Meta Quest players in two small waves to help improve the first-time experience, controls, progression and comfort.

- **Payment:** US$30 via PayPal for the agreed test, with payment sent within seven calendar days of a complete submission.
- **Time:** up to 60 active minutes including setup, around 40 minutes of play, and a short feedback form. Breaks are welcome.
- **Hardware:** Quest 2, Quest 3, Quest 3S or Quest Pro, subject to the final supported-build list on the application page.
- **Access:** an evaluation key is provided free after selection. You may keep the redeemed copy; keys must not be shared or resold.
- **Feedback:** a private website questionnaire and a 10–15-minute gameplay recording. No webcam required; a screenshot-and-notes alternative can be agreed before starting.
- **Eligibility:** 18+, new to Buried Worlds VR, able to give feedback in English, and able to receive PayPal payments in your country.

Honest criticism is welcome. Payment does not depend on finding bugs, liking the game or posting a store review. If a game problem or VR discomfort stops a genuine test attempt, send a short report and you will still be paid in full.

Applications are reviewed for headset coverage and a mix of VR experience. Applying does not guarantee selection. Selected testers receive a clear brief and have five days to complete the test.

Apply at **[insert the verified live /playtest page]**. The page includes full payment, withdrawal and privacy terms. Please keep email addresses and payment details out of public comments.

## What success looks like

Track verified eligible applications, accepted invitations, completed sessions, device coverage, active-time overruns, payment timeliness and cost per completed test. Compare the two waves on unaided onboarding, completion of the core actions, save/resume problems and reported discomfort. Report counts with denominators, such as “3 of 4 pilot players could not discover selling,” rather than population-level conclusions.

Produce a short ranked issue list supported by timestamps or specific observations. Resolve or explicitly accept important blockers before expanding the study. Paid sessions reveal usability problems; willingness to return in a paid study is not proof of organic retention or sales demand.
