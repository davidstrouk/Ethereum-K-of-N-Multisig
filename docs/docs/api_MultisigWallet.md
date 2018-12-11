---
id: MultisigWallet
title: MultisigWallet
---

<div class="contract-doc">
    <div class="contract"><h2 class="contract-header"><span class="contract-kind">contract</span> MultisigWallet</h2>
        <p class="description">Create new shared wallets.</p>
        <div class="source"><b>Source:</b> <a href="git+https://github.com/davidstrouk/Ethereum-K-of-N-Multisig/blob/v1.0.0/contracts/MultisigWallet.sol" target="_blank">MultisigWallet.sol</a></div>
        <div class="author"><b>Author:</b> Shoval Loolian, David Strouk</div>
    </div>
    <div class="index"><h2>Index</h2>
        <ul>
        	<li><a href="MultisigWallet.html#constructor">constructor</a></li>
            <li><a href="MultisigWallet.html#addGroup">addGroup</a></li>
        </ul>
    </div>
    <div class="reference"><h2>Reference</h2>
        <div class="functions"><h3>Functions</h3>
            <ul>
            	<li>
                    <div class="item function"><span id="constructor" class="anchor-marker"></span><h4 class="name">constructor</h4>
                        <div class="body"><code class="signature">function <strong></strong><span>() </span><span>public </span></code>
                            <hr />
                            <div class="description">
                                <p>Initialize MultisigWallet contract.</p>
                            </div>
                        </div>
                    </div>
                </li>
                <li>
                    <div class="item function"><span id="addGroup" class="anchor-marker"></span><h4 class="name">addGroup</h4>
                        <div class="body"><code class="signature">function <strong>addGroup</strong><span>(address[] wallets, uint k) </span><span>public </span><span>returns  (KofNMultisig) </span></code>
                            <hr />
                            <div class="description">
                                <p>Create new shared wallet of type &quot;KofNMultisig&quot; between N users.</p>
                            </div>
                            <dl><dt><span class="label-parameters">Parameters:</span></dt>
                                <dd>
                                    <div><code>wallets</code> - The wallets addresses of the N users</div>
                                    <div><code>k</code> - The size of required approvals</div>
                                </dd><dt><span class="label-return">Returns:</span></dt>
                                <dd>The address of the new shared wallet contract</dd>
                            </dl>
                        </div>
                    </div>
                </li>
            </ul>
        </div>
    </div>
</div>
