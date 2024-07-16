export default function Coord({ size, children, ...props }: React.HTMLAttributes<HTMLDivElement> & { size: number }) {
	return (
		<cr-coord
			{...props}
			style={{ left: -size / 45, fontSize: Math.floor(size / 50), width: size / 8, height: size / 8, ...props.style }}
		>
			{children}
		</cr-coord>
	);
}