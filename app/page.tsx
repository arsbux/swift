'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Card } from '@/components/ui';

export default function Home() {
  const router = useRouter();
  const [request, setRequest] = useState('');

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!request.trim()) return;
    
    // Store search params and redirect to search results
    const searchParams = {
      description: request.trim(),
      minBudget: null,
      maxBudget: null,
      skillLevel: null,
      category: null,
      deadline: null,
    };
    
    sessionStorage.setItem('search_params', JSON.stringify(searchParams));
    router.push('/search/results');
  };

  return (
    <div className="min-h-screen bg-black lg:ml-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="relative flex flex-col items-center justify-center min-h-[85vh] text-center pt-12 pb-16 bg-black hero-pattern-dark">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-black/95 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-accent/5 pointer-events-none" />
          
          <div className="relative max-w-5xl mx-auto px-4">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 border border-accent/30 rounded-full mb-8 animate-fade-in">
              <span className="text-sm font-medium text-accent">✓</span>
              <span className="text-sm font-medium text-white">Vetted freelancers · Direct connection · 48h delivery</span>
            </div>

            {/* Main headline - improved typography */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-8 leading-[1.1] tracking-tight max-w-4xl mx-auto">
              Get real work done{' '}
              <span className="text-accent">fast</span>
            </h1>

            {/* Subheadline with better hierarchy */}
            <p className="text-xl sm:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              We will connect you to the right person ASAP
            </p>

            {/* Enhanced trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 mb-12 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span>No bids</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span>No guessing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span>Just outcomes</span>
              </div>
            </div>

            {/* Enhanced CTA Section */}
            <div className="w-full max-w-3xl mx-auto mb-8">
              <form onSubmit={handleRequestSubmit} className="relative">
                <div className="flex flex-col sm:flex-row gap-3 p-2 bg-black/10 backdrop-blur-sm rounded-2xl shadow-soft-lg border border-white/20">
                <Input
                  value={request}
                  onChange={(e) => setRequest(e.target.value)}
                    placeholder="I need a 1-page landing page with email capture in 48 hours"
                    className="flex-1 text-base border-0 focus:ring-0 bg-transparent px-4 text-white placeholder:text-gray-400"
                />
                <Button 
                  type="submit" 
                  size="lg" 
                  variant="primary" 
                    className="w-full sm:w-auto px-8 font-semibold whitespace-nowrap shadow-none hover:shadow-md transition-all"
                  disabled={!request.trim()}
                >
                    Get started →
                </Button>
                </div>
              </form>
              
              <p className="text-sm text-gray-400 mt-4">
                Free connection in 60 seconds · No payment required
              </p>
            </div>

            {/* Freelancer CTA - more subtle */}
            <div className="pt-6 border-t border-gray-800 max-w-2xl mx-auto">
              <p className="text-sm text-gray-300 mb-3">
                Are you a freelancer?
              </p>
            <Link href="/signup?role=freelancer">
                <Button size="md" variant="outline" className="font-medium border-white/30 text-white hover:border-accent hover:text-accent hover:bg-accent/10 transition-colors">
                  Join our vetted talent pool
              </Button>
            </Link>
            </div>
          </div>
        </div>

        {/* Why Swift Section */}
        <div className="py-12 sm:py-16 md:py-24 bg-black">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Why Swift
            </h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              Trust, speed, outcome. Most marketplaces force you to browse, bargain, and babysit. We eliminate the noise and create one clear pathway: brief → match → connect → deliver. You get predictable results; freelancers get reliable connections.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 sm:gap-12">
            <Card className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-accent/20 rounded-full flex items-center justify-center text-2xl text-accent">
                ✓
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Vetted talent only</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Freelancers must submit proof items and pass a quick verification before they&apos;re eligible for matches.
              </p>
            </Card>
            <Card className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-accent/20 rounded-full flex items-center justify-center text-2xl text-accent">
                🔒
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Direct connection</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Connect directly with freelancers. No middleman, no fees, just direct communication.
              </p>
            </Card>
            <Card className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-accent/20 rounded-full flex items-center justify-center text-2xl text-accent">
                🎯
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Outcome-first</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                We match based on deliverables and acceptance criteria, not subjective profiles.
              </p>
            </Card>
          </div>
        </div>

        {/* How it Works Section */}
        <div className="py-12 sm:py-16 md:py-24 bg-gray-950">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              How it Works — 4 Simple Steps
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <Card className="p-6">
              <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center text-xl font-bold mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Describe your need</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                One sentence: what, by when, budget.
              </p>
            </Card>
            <Card className="p-6">
              <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center text-xl font-bold mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Confirm scope</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                We auto-suggest acceptance criteria and finalize the project details.
              </p>
            </Card>
            <Card className="p-6">
              <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center text-xl font-bold mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Get matched</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                A vetted freelancer is held for you. They accept and start within the SLA.
              </p>
            </Card>
            <Card className="p-6">
              <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center text-xl font-bold mb-4">
                4
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Approve & complete</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Review against the checklist. Approve when satisfied; request a revision if needed.
              </p>
            </Card>
          </div>

          <div className="text-center mt-8">
            <Button size="lg" variant="primary" onClick={() => router.push('/search')}>
              Describe your deliverable
            </Button>
          </div>
        </div>

        {/* Featured Deliverables Section */}
        <div className="py-12 sm:py-16 md:py-24 bg-black">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Featured Deliverables
            </h2>
            <p className="text-gray-300">
              Examples that convert
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold mb-2 text-white">Landing page with email capture</h3>
              <p className="text-sm text-accent font-medium">Delivered in 48h</p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold mb-2 text-white">30–60s product/video ad</h3>
              <p className="text-sm text-accent font-medium">Delivered in 72h</p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold mb-2 text-white">Bug fix or urgent patch</h3>
              <p className="text-sm text-accent font-medium">Delivered in 24h</p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold mb-2 text-white">Copywriting: sales page or email sequence</h3>
              <p className="text-sm text-accent font-medium">Delivered in 48–72h</p>
            </Card>
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-gray-400 mb-4">
              Don&apos;t see your deliverable? Describe it — we&apos;ll connect you with the right freelancer.
            </p>
            <Button variant="outline" onClick={() => router.push('/search')} className="border-gray-700 text-white hover:border-accent hover:text-accent">
              Describe your deliverable
            </Button>
          </div>
        </div>

        {/* Delivery Speed Section */}
        <div className="py-12 sm:py-16 md:py-24 bg-gray-950">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Delivery Speed Options
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Choose the timeline that works for your project:
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="p-6">
              <h3 className="text-xl font-bold text-white mb-2">Fast</h3>
              <p className="text-gray-400 text-sm mb-4">24–48 hours, 1 revision</p>
              <p className="text-lg font-medium text-accent mb-4">Quick turnaround</p>
            </Card>
            <Card className="p-6 border-2 border-accent">
              <h3 className="text-xl font-bold text-white mb-2">Standard</h3>
              <p className="text-gray-400 text-sm mb-4">48–72 hours, 1 revision</p>
              <p className="text-lg font-medium text-accent mb-4">Most popular</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-bold text-white mb-2">Premium</h3>
              <p className="text-gray-400 text-sm mb-4">72 hours, 2 revisions + priority support</p>
              <p className="text-lg font-medium text-accent mb-4">Comprehensive</p>
            </Card>
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-gray-400 mb-4">
              Connect directly with freelancers. No platform fees, no hidden costs.
            </p>
            <Button size="lg" variant="primary" onClick={() => router.push('/search')}>
              Get connected now
            </Button>
          </div>
        </div>

        {/* Guarantees & Trust Section */}
        <div className="py-12 sm:py-16 md:py-24 bg-black">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Guarantees & Trust
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3 text-white">Quality Guarantee</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                If the deliverable doesn&apos;t meet the agreed acceptance criteria after two revisions, we&apos;ll connect you with a replacement freelancer at no extra cost.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3 text-white">Vetted Talent</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Every freelancer is required to provide proof of work. We verify at least 3 samples before they&apos;re eligible for matches.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3 text-white">SLA Promise</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                If your matched freelancer doesn&apos;t accept within 20 minutes, we auto-assign the next available specialist. If deadlines are missed, you qualify for a fast replacement.
              </p>
            </Card>
          </div>
        </div>

        {/* Real Results Section */}
        <div className="py-12 sm:py-16 md:py-24 bg-gray-950">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Real Results
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="p-6">
              <p className="text-gray-300 mb-4 italic leading-relaxed">
                &quot;We launched a landing page in 48 hours and doubled our signup rate the first week.&quot;
              </p>
              <p className="text-sm font-medium text-white">— Sarah M., founder</p>
            </Card>
            <Card className="p-6">
              <p className="text-gray-300 mb-4 italic leading-relaxed">
                &quot;Quick, clean work. Direct connection made the process smooth and efficient.&quot;
              </p>
              <p className="text-sm font-medium text-white">— Daniel K., product manager</p>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="py-12 sm:py-16 md:py-24 bg-black">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              FAQ
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2 text-white">How quickly can I get work started?</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                For &quot;Fast&quot; jobs we match within 1 hour. Typical delivery windows are 24–72 hours depending on scope.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2 text-white">How does the connection work?</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                We match you directly with a vetted freelancer based on your project needs. You connect and work together directly, with no platform fees or intermediaries.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2 text-white">What if the work is poor?</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                You can request up to two revisions. If the acceptance criteria still aren&apos;t met, we&apos;ll connect you with a replacement freelancer at no extra cost.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2 text-white">Are there any fees?</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                No. Our platform is completely free. You connect directly with freelancers and handle payment arrangements between yourselves. No platform fees, no hidden costs.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2 text-white">How do you vet freelancers?</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Freelancers submit three proof items and a short skills matrix. We verify samples and performance history before they join the talent pool.
              </p>
            </Card>
          </div>
        </div>

        {/* For Freelancers Section */}
        <div className="py-12 sm:py-16 md:py-24 bg-gray-950">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              For Freelancers
            </h2>
            <h3 className="text-xl font-semibold mb-4 text-white">
              Join the on-call pool
            </h3>
            <p className="text-gray-300 mb-8 leading-relaxed">
              We route verified, reliable freelancers to quality projects — no wasting time on ghost clients. Upload three proof items, set your packages, and start getting connected with clients.
            </p>
            <Link href="/signup?role=freelancer">
              <Button size="lg" variant="primary">
                Apply as a freelancer
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="py-12 sm:py-16 md:py-24 border-t border-gray-800 bg-black">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Ready to get started?
            </h2>
            <p className="text-gray-300 mb-8">
              Describe your deliverable now and get connected with the right freelancer.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="primary" onClick={() => router.push('/search')}>
                Get connected now
              </Button>
            </div>
            <div className="mt-12 pt-8 border-t border-gray-800">
              <p className="text-sm text-gray-400">
                Contact: <a href="mailto:support@swift.com" className="text-accent hover:text-accent-hover">support@swift.com</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
