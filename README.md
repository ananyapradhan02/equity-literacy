# equity literacy

short, interactive lessons and two calculators for people who hold startup equity: options, RSUs and Indian ESOPs. US and India side by side, in dollars and rupees.

**for:** startup employees reading their first or next offer (direct), and people teams who fork it for their own staff (enterprise).

**hypothesis:** an employee finishes one lesson and uses one calculator in a single sitting.

## what is in v0.1

- lesson 01, options basics: iso, nso, rsu and esop, with a US and an India worked example
- lesson 02, vesting, cliffs and triggers: single and double trigger, early exercise and 83(b)
- lesson 03, 409a versus preferred: why the round price is not your price, with a liquidation preference example
- each lesson has two recall questions (reveal the reasoning), a sources list with links, and "education, not tax or legal advice"
- cliff date calculator: cliff date, shares at cliff, a full vesting table and what is vested today
- dilution calculator: ownership before and after a round with an option pool top-up, and the value of your stake at the new price, in dollars or rupees
- inputs, lesson progress and theme are saved in your browser only; both calculators have "copy as text"

## open it

- live: https://ananyapradhan02.github.io/equity-literacy/
- local: open `index.html` in a browser (`file://` works, no build step)

## numbers

every worked example uses round illustrative numbers, not any real company's cap table or valuation. the rules stated in the lessons (the iso limit, 83(b), the 409A safe harbour, India's esop perquisite at exercise) are linked to their source in each lesson's sources list. section numbers for India are from the income-tax act, 1961; the income-tax act, 2025 renumbers them from 01.04.26 without changing the treatment.

## test script (one real person, fifteen minutes)

1. "you just got an offer with options. open this and do whatever you'd do first." watch where they go, and whether they finish a lesson.
2. "put in your own grant, or a made-up one, and tell me the date you could leave without losing the first year." does the cliff calculator answer it without help?
3. "the company raises at forty million. what happens to your share?" can they read before and after ownership from the dilution calculator, and do they trust it?

## what to decide after testing

- if people finish a lesson and use a calculator in one sitting, build lessons four to ten next.
- if they skip the lessons and go straight to the calculators, lead with the tools and turn lessons into short notes under them.
- if a people team asks to fork it, write the "run it for your company" section before more lessons.

## status

v0.1, 30.09.26. lessons one to three and two calculators. education, not tax or legal advice.
