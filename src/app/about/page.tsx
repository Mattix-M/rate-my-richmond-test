import {data} from '@/lib/model';

export const metadata = {title: 'About'};

export default function Page() {
  return <div className="about">
    <section className="page-heading"><div>
      <div className="eyebrow">About this thing</div>
      <h1>Why does this exist?</h1>
    </div></section>

    <div className="about-intro">
      <p>I was bored and this seemed like a fun and useful project.</p>
      <p>AND AGAIN: THIS IS FROM ANONYMOUS, BIASED REVIEWS. Not affiliated with the University of Richmond or Rate My Professors.</p>
      <p>Use your brain.</p>
    </div>

    <section id="methodology" className="section">
      <h2>How the numbers work.</h2>
      <div className="methodology-grid">
        <article><h3>Where this came from</h3><p>{data.meta.reviews.toLocaleString('en-US')} anonymous Rate My Professors reviews from 2002–2026. People choose whether to post, so this is not a scientific survey or an official evaluation. It is a large pile of student opinions.</p></article>
        <article><h3>The one-review problem</h3><p>A single five-star review should not make someone number one. The all-time rankings only include the 219 professors with at least 20 reviews, then pull extreme scores toward the Richmond average. More reviews means less pulling.</p></article>
        <article><h3>What “recent” means</h3><p>Recent means 2022–2026. It requires at least 15 reviews and uses a lighter adjustment worth 10 average reviews. Also, 2026 is still happening, which feels obvious but apparently needs to be written down.</p></article>
        <article><h3>The Alpha thing</h3><p>Alpha is a custom score for ratings compared with what the model expected after difficulty, department, and year. Positive means higher than expected. It sounds more dramatic than it is, and it is not an official RMP score.</p></article>
        <article><h3>When students disagree</h3><p>The disagreement score looks at how spread out the quality ratings are. A high number means students had very different experiences. It does not automatically mean the professor was bad.</p></article>
        <article><h3>Departments and schools</h3><p>The department and school averages come from the supplied summaries. Economics stays separate from Robins. “Broad STEM” means Gottwald plus Math &amp; CS. Review-weighted averages give every review equal weight; professor-weighted averages give every professor equal weight.</p></article>
        <article><h3>What we do not have</h3><p>Some analyses were never supplied, including recent Alpha and recent department summaries. I am not making numbers up to fill the space. If the data is missing, the site says so.</p></article>
        <article><h3>Names and reviews</h3><p>Fourteen documented name variations are combined so the same professor does not appear twice. The original review comments are shown exactly as posted. That does not make every claim in them true.</p></article>
        <article><h3>The extra comparisons</h3><p>The time comparison uses 2002–2021 versus 2022–2026, with at least 15 reviews in each. Course comparisons also need 15 reviews per course. They show what changed in the reviews, not why it changed.</p></article>
      </div>
      <details className="method"><summary>The extremely boring fine print</summary>
        <p>There are {data.meta.professors} professor groups after combining documented name variations. Some departments were never mapped to an academic group and stay “Unmapped.” The 27 department summaries do not cover every review. Missing or ineligible adjusted scores appear as a dash, and the source files are never edited.</p>
        <p>The Robins comparison controls for course level and review year. Its confidence interval shows the model’s uncertainty, and its p-value tests compatibility with no difference. It still describes self-selected reviews; it does not prove that attending one school causes anything.</p>
      </details>
    </section>
  </div>;
}
