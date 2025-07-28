import Image from 'next/image'
import { useTheme } from '@/context'

const DynamicAvatar = ({
    playerItems,
    size = 'w-full h-full',
    showBorder = false,
    width = 300,
    height = 300
}) => {
    const { themeMode } = useTheme()
    const isNight = themeMode === 'dark'

    // Mapping des slots vers les noms de dossiers
    const slotFolders = ['rabbit_color', 'backgrounds', 'clothes', 'glasses', 'hat']
    const slotLabels = ["Rabbit Color", "Backgrounds", "Clothes", "Glasses", "Hat"]

    return (
        <div className={`relative ${size}`}>
            {slotFolders.map((folder, index) => {
                const itemLevel = playerItems[index] || 0
                const imagePath = `/img/shop/${folder}/${itemLevel}.webp`

                // Ordre des z-index : background au plus bas, puis rabbit_color, clothes, glasses, hat au plus haut
                const zIndexOrder = {
                    'backgrounds': 1,
                    'rabbit_color': 2,
                    'clothes': 3,
                    'glasses': 4,
                    'hat': 5
                }

                return (
                    <Image
                        key={`${folder}-${itemLevel}`}
                        src={imagePath}
                        alt={`${slotLabels[index]} level ${itemLevel}`}
                        width={width}
                        height={height}
                        className={`absolute top-0 left-0 ${size} object-contain`}
                        style={{
                            zIndex: zIndexOrder[folder] || index,
                            border: folder === 'rabbit_color' && showBorder ? `3px solid ${isNight ? '#888' : '#ddd'}` : 'none',
                            borderRadius: showBorder ? '50%' : '0',
                        }}
                    />
                )
            })}
        </div>
    )
}

export default DynamicAvatar