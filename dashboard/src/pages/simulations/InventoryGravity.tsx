import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { ArrowLeft, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const InventoryGravity: React.FC = () => {
    const sceneRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<Matter.Engine | null>(null);
    const renderRef = useRef<Matter.Render | null>(null);
    const runnerRef = useRef<Matter.Runner | null>(null);
    const [stats, setStats] = useState({ count: 0, value: 0 });

    useEffect(() => {
        if (!sceneRef.current) return;

        // Fetch data
        const fetchData = async () => {
            try {
                const response = await fetch('/api/chat/analysis');
                const result = await response.json();
                const products = result.products || [];
                initSimulation(products);
            } catch (err) {
                console.error("Failed to load data", err);
                initSimulation([]); // Fallback
            }
        };

        fetchData();

        return () => {
            cleanup();
        };
    }, []);

    const cleanup = () => {
        if (renderRef.current) {
            Matter.Render.stop(renderRef.current);
            if (renderRef.current.canvas) {
                renderRef.current.canvas.remove();
            }
        }
        if (runnerRef.current) {
            Matter.Runner.stop(runnerRef.current);
        }
        if (engineRef.current) {
            Matter.World.clear(engineRef.current.world, false);
            Matter.Engine.clear(engineRef.current);
        }
    };

    const initSimulation = (products: any[]) => {
        cleanup();

        const Engine = Matter.Engine,
            Render = Matter.Render,
            Runner = Matter.Runner,
            Bodies = Matter.Bodies,
            Composite = Matter.Composite,
            Mouse = Matter.Mouse,
            MouseConstraint = Matter.MouseConstraint;

        const engine = Engine.create();
        engineRef.current = engine;

        const width = window.innerWidth;
        const height = window.innerHeight;

        const render = Render.create({
            element: sceneRef.current!,
            engine: engine,
            options: {
                width,
                height,
                wireframes: false,
                background: '#050505',
                pixelRatio: window.devicePixelRatio
            }
        });
        renderRef.current = render;

        // Create container walls
        const wallOptions = {
            isStatic: true,
            render: { fillStyle: '#333' }
        };
        const ground = Bodies.rectangle(width / 2, height + 50, width, 100, wallOptions);
        const leftWall = Bodies.rectangle(-50, height / 2, 100, height, wallOptions);
        const rightWall = Bodies.rectangle(width + 50, height / 2, 100, height, wallOptions);

        Composite.add(engine.world, [ground, leftWall, rightWall]);

        // Add Product Bodies
        const bodies: Matter.Body[] = [];
        let totalValue = 0;

        products.slice(0, 100).forEach((p: any) => {
            const size = Math.min(Math.max(p.current_stock / 10, 20), 60); // Scale size
            const x = Math.random() * (width - 100) + 50;
            const y = -Math.random() * 2000 - 100; // Stagger drop

            let color = '#10b981'; // Green (Safe)
            if (p.risk_level === 'CRITICAL') color = '#ef4444'; // Red
            else if (p.risk_level === 'WARNING') color = '#f59e0b'; // Orange
            else if (p.profit_per_unit < 0) color = '#ec4899'; // Pink (Loss)

            totalValue += (p.selling_price * p.current_stock);

            const body = Bodies.circle(x, y, size, {
                restitution: 0.5,
                render: {
                    fillStyle: color,
                    strokeStyle: '#ffffff',
                    lineWidth: 1
                },
                label: p.product_name
            });
            bodies.push(body);
        });

        setStats({ count: products.length, value: totalValue });
        Composite.add(engine.world, bodies);

        // Add Mouse Control
        const mouse = Mouse.create(render.canvas);
        const mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: { visible: false }
            }
        });
        Composite.add(engine.world, mouseConstraint);

        // Keep the mouse in sync with rendering
        render.mouse = mouse;

        // Run
        Render.run(render);
        const runner = Runner.create();
        runnerRef.current = runner;
        Runner.run(runner, engine);
    };

    const addNewItems = () => {
        if (!engineRef.current) return;
        const width = window.innerWidth;
        const Bodies = Matter.Bodies;
        const Composite = Matter.Composite;

        const newBodies = [];
        for (let i = 0; i < 10; i++) {
            newBodies.push(Bodies.circle(
                Math.random() * width,
                -100,
                30,
                {
                    restitution: 0.7,
                    render: { fillStyle: '#3b82f6' }
                }
            ));
        }
        Composite.add(engineRef.current.world, newBodies);
    };

    const clearAll = () => {
        if (!engineRef.current) return;
        const Composite = Matter.Composite;
        const bodies = Composite.allBodies(engineRef.current.world);
        // Keep walls (static bodies)
        const nonStatic = bodies.filter(b => !b.isStatic);
        Composite.remove(engineRef.current.world, nonStatic);
    };

    const toggleGravity = () => {
        if (!engineRef.current) return;
        const currentY = engineRef.current.world.gravity.y;

        if (currentY === 1) {
            engineRef.current.world.gravity.y = 0; // Zero G
        } else if (currentY === 0) {
            engineRef.current.world.gravity.y = -0.5; // Reverse Gravity
        } else {
            engineRef.current.world.gravity.y = 1; // Normal
        }
    };

    const triggerBlast = () => {
        if (!engineRef.current) return;
        const bodies = Matter.Composite.allBodies(engineRef.current.world);
        const nonStatic = bodies.filter(b => !b.isStatic);

        nonStatic.forEach(body => {
            const forceMagnitude = 0.05 * body.mass;
            Matter.Body.applyForce(body, body.position, {
                x: (Math.random() - 0.5) * forceMagnitude,
                y: -forceMagnitude
            });
        });
    };

    return (
        <div className="relative min-h-screen bg-[#050505] overflow-hidden">
            {/* Canvas Container */}
            <div ref={sceneRef} className="absolute inset-0" />

            {/* UI Overlay */}
            <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start pointer-events-none">
                <Link to="/simulations" className="pointer-events-auto p-3 bg-white/10 rounded-full hover:bg-white/20 backdrop-blur-md transition-colors text-white">
                    <ArrowLeft className="w-6 h-6" />
                </Link>

                <div className="text-right text-white space-y-2">
                    <h1 className="text-4xl font-bold uppercase tracking-tighter">Inventory Gravity</h1>
                    <p className="font-mono text-gray-400">
                        Physics-based visualization of <span className="text-white font-bold">{stats.count}</span> products.
                        <br />
                        Size = Stock Level. Color = Profit/Risk.
                    </p>
                </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex gap-4 pointer-events-auto">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addNewItems}
                    className="flex items-center gap-2 px-6 py-4 bg-blue-600 rounded-full text-white font-bold shadow-lg shadow-blue-500/30"
                >
                    <Plus className="w-5 h-5" /> RESTOCK
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleGravity}
                    className="flex items-center gap-2 px-6 py-4 bg-purple-600 rounded-full text-white font-bold shadow-lg shadow-purple-500/30"
                >
                    <RefreshCw className="w-5 h-5" /> GRAVITY
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={triggerBlast}
                    className="flex items-center gap-2 px-6 py-4 bg-red-600 rounded-full text-white font-bold shadow-lg shadow-red-500/30"
                >
                    💥 BLAST
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={clearAll}
                    className="flex items-center gap-2 px-6 py-4 bg-white/10 backdrop-blur-md rounded-full text-white font-bold hover:bg-white/20"
                >
                    <Trash2 className="w-5 h-5" /> CLEAR
                </motion.button>
            </div>
        </div>
    );
};

export default InventoryGravity;
